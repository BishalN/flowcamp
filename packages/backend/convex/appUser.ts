import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

type Ctx = QueryCtx | MutationCtx;

export async function getAuthUserIdOrNull(ctx: Ctx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  // safeGetAuthUser is a function that returns the auth user if it exists, otherwise it returns null, why have it though?? learn about it
  const authUser = await authComponent.safeGetAuthUser(ctx);
  return authUser ? String(authUser._id) : null;
}

export async function requireAuthUserId(ctx: Ctx): Promise<string> {
  const authUserId = await getAuthUserIdOrNull(ctx);
  if (!authUserId) throw new Error("Not authenticated");
  return authUserId;
}

export async function getCurrentWorkspaceMembership(
  ctx: Ctx,
): Promise<Doc<"workspaceMembers"> | null> {
  const authUserId = await getAuthUserIdOrNull(ctx);
  if (!authUserId) return null;
  return await ctx.db
    .query("workspaceMembers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .first();
}

export async function requireWorkspaceMember(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
): Promise<{ membership: Doc<"workspaceMembers">; workspace: Doc<"workspaces"> }> {
  const authUserId = await requireAuthUserId(ctx);
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspaceId_and_authUserId", (q) =>
      q.eq("workspaceId", workspaceId).eq("authUserId", authUserId),
    )
    .unique();
  if (!membership) {
    throw new Error("Unauthorized");
  }
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  return { membership, workspace };
}

export async function requireWorkspaceOwner(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
): Promise<{ membership: Doc<"workspaceMembers">; workspace: Doc<"workspaces"> }> {
  const result = await requireWorkspaceMember(ctx, workspaceId);
  if (result.membership.role !== "owner") {
    throw new Error("Unauthorized");
  }
  return result;
}
