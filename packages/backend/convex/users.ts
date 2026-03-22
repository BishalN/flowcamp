import { v } from "convex/values";

import { authComponent } from "./auth";
import { getAppUserOrNull } from "./appUser";
import { deriveBootstrapFlags } from "../lib/onboarding";
import { mutation, query } from "./_generated/server";

const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  tokenIdentifier: v.string(),
  authUserId: v.string(),
  email: v.string(),
  name: v.string(),
  imageUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  lastSeenAt: v.optional(v.number()),
});

const membershipDocValidator = v.object({
  _id: v.id("workspaceMembers"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  userId: v.id("users"),
  role: v.union(v.literal("owner"), v.literal("member")),
  joinedAt: v.number(),
});

const workspaceDocValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  ownerUserId: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getBootstrapState = query({
  args: {},
  returns: v.object({
    user: v.union(userDocValidator, v.null()),
    membership: v.union(membershipDocValidator, v.null()),
    workspace: v.union(workspaceDocValidator, v.null()),
    needsUserRecord: v.boolean(),
    needsWorkspaceCreation: v.boolean(),
    canAcceptInvite: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await getAppUserOrNull(ctx);
    const membership = user
      ? await ctx.db
          .query("workspaceMembers")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first()
      : null;
    const workspace = membership !== null ? await ctx.db.get(membership.workspaceId) : null;
    const flags = deriveBootstrapFlags({
      hasAppUser: user !== null,
      hasMembership: membership !== null,
    });
    return {
      user,
      membership,
      workspace,
      needsUserRecord: flags.needsUserRecord,
      needsWorkspaceCreation: flags.needsWorkspaceCreation,
      canAcceptInvite: flags.canAcceptInvite,
    };
  },
});

export const storeCurrentUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    const authUserId = String(authUser._id);
    const imageUrl = authUser.image ?? undefined;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: authUser.email,
        name: authUser.name,
        imageUrl,
        authUserId,
        updatedAt: now,
        lastSeenAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      authUserId,
      email: authUser.email,
      name: authUser.name,
      imageUrl,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });
  },
});
