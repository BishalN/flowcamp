import { v } from "convex/values";

import {
  getCurrentWorkspaceMembership,
  getAuthUserIdOrNull,
  requireAuthUserId,
  requireWorkspaceOwner,
} from "./appUser";
import {
  evaluateInvite,
  generateInviteToken,
  getInviteAcceptBlockedReason,
  getInvitePreviewReason,
  hashInviteToken,
  INVITE_TTL_MS,
} from "../lib/invites";
import { mutation, query } from "./_generated/server";

const siteUrl = process.env.SITE_URL!;

const previewReasonValidator = v.union(
  v.literal("ok"),
  v.literal("expired"),
  v.literal("revoked"),
  v.literal("consumed"),
  v.literal("invalid-token"),
  v.literal("already-member"),
  v.literal("already-in-another-workspace"),
);

export const getActiveLink = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      inviteId: v.id("workspaceInvites"),
      status: v.literal("active"),
      expiresAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAuthUserId(ctx);
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    await requireWorkspaceOwner(ctx, membership.workspaceId);
    const active = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", membership.workspaceId).eq("status", "active"),
      )
      .first();
    if (!active) {
      return null;
    }
    return {
      inviteId: active._id,
      status: "active" as const,
      expiresAt: active.expiresAt,
      createdAt: active.createdAt,
    };
  },
});

export const getInvitePreview = query({
  args: {
    token: v.string(),
  },
  returns: v.object({
    workspaceName: v.union(v.string(), v.null()),
    inviterName: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("active"),
      v.literal("revoked"),
      v.literal("consumed"),
      v.literal("invalid"),
    ),
    reason: previewReasonValidator,
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const trimmed = args.token.trim();
    if (trimmed.length === 0) {
      return {
        workspaceName: null,
        inviterName: null,
        status: "invalid" as const,
        reason: "invalid-token" as const,
      };
    }
    const tokenHash = await hashInviteToken(trimmed);
    const invite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    const authUserId = await getAuthUserIdOrNull(ctx);
    let callerHasAnyMembership = false;
    let callerInTargetWorkspace = false;
    if (authUserId) {
      const m = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
        .first();
      callerHasAnyMembership = m !== null;
      if (m && invite) {
        callerInTargetWorkspace = m.workspaceId === invite.workspaceId;
      }
    }

    if (!invite) {
      return {
        workspaceName: null,
        inviterName: null,
        status: "invalid" as const,
        reason: "invalid-token" as const,
      };
    }

    const workspace = await ctx.db.get(invite.workspaceId);

    const evaluation = evaluateInvite({
      status: invite.status,
      expiresAt: invite.expiresAt,
      now,
    });

    const reason = getInvitePreviewReason({
      inviteFound: true,
      evaluation,
      callerHasAnyMembership,
      callerInTargetWorkspace,
    });

    // TODO: simpler way to do this?
    let statusOut: "active" | "revoked" | "consumed" | "invalid";
    if (invite.status === "revoked") {
      statusOut = "revoked";
    } else if (invite.status === "consumed") {
      statusOut = "consumed";
    } else if (evaluation.kind === "expired") {
      statusOut = "invalid";
    } else {
      statusOut = "active";
    }

    return {
      workspaceName: workspace?.name ?? null,
      inviterName: null,
      status: statusOut,
      reason,
    };
  },
});

export const generate = mutation({
  args: {},
  returns: v.object({
    inviteId: v.id("workspaceInvites"),
    inviteUrl: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx) => {
    const authUserId = await requireAuthUserId(ctx);
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    await requireWorkspaceOwner(ctx, membership.workspaceId);
    const workspaceId = membership.workspaceId;
    const now = Date.now();

    const existingActive = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "active"),
      )
      .collect();
    for (const inv of existingActive) {
      await ctx.db.patch(inv._id, {
        status: "revoked",
        revokedAt: now,
      });
    }

    const rawToken = generateInviteToken();
    const tokenHash = await hashInviteToken(rawToken);
    const expiresAt = now + INVITE_TTL_MS;
    const inviteId = await ctx.db.insert("workspaceInvites", {
      workspaceId,
      createdByAuthUserId: authUserId,
      tokenHash,
      role: "member",
      status: "active",
      expiresAt,
      createdAt: now,
    });

    const base = siteUrl.replace(/\/$/, "");
    const inviteUrl = `${base}/join/${rawToken}`;

    return { inviteId, inviteUrl, expiresAt };
  },
});

export const revoke = mutation({
  args: { inviteId: v.id("workspaceInvites") },
  returns: v.object({ inviteId: v.id("workspaceInvites") }),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    await requireWorkspaceOwner(ctx, membership.workspaceId);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }
    if (invite.workspaceId !== membership.workspaceId) {
      throw new Error("Unauthorized");
    }
    if (invite.status === "consumed") {
      throw new Error("Invite already consumed");
    }
    const now = Date.now();
    if (invite.status === "revoked") {
      return { inviteId: invite._id };
    }
    await ctx.db.patch(invite._id, {
      status: "revoked",
      revokedAt: now,
    });
    return { inviteId: invite._id };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  returns: v.object({ workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const trimmed = args.token.trim();
    if (trimmed.length === 0) {
      throw new Error("Invalid token");
    }
    const now = Date.now();
    const tokenHash = await hashInviteToken(trimmed);
    const invite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!invite) {
      throw new Error("Invalid or expired invite");
    }

    const evaluation = evaluateInvite({
      status: invite.status,
      expiresAt: invite.expiresAt,
      now,
    });

    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .first();

    const callerInTargetWorkspace =
      existingMembership !== null && existingMembership.workspaceId === invite.workspaceId;

    const reason = getInviteAcceptBlockedReason({
      evaluation,
      callerHasAnyMembership: existingMembership !== null,
      callerInTargetWorkspace,
    });

    if (reason !== "ok") {
      if (reason === "expired") {
        throw new Error("Invite expired");
      }
      if (reason === "revoked") {
        throw new Error("Invite revoked");
      }
      if (reason === "consumed") {
        throw new Error("Invite already used");
      }
      if (reason === "already-member") {
        throw new Error("Already a member of this workspace");
      }
      if (reason === "already-in-another-workspace") {
        throw new Error("Already in another workspace");
      }
    }

    await ctx.db.insert("workspaceMembers", {
      workspaceId: invite.workspaceId,
      authUserId,
      role: "member",
      joinedAt: now,
    });

    await ctx.db.patch(invite._id, {
      status: "consumed",
      consumedAt: now,
      consumedByAuthUserId: authUserId,
    });

    return { workspaceId: invite.workspaceId };
  },
});
