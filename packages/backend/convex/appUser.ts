import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/**
 * App-owned `users` row for the current session, or `null` if unauthenticated or no row yet.
 * (Distinct from Better Auth `auth.ts` `getCurrentUser`, which returns the auth component user.)
 */
export async function getAppUserOrNull(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  return user ?? null;
}

export async function getAppUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new Error("App user not found");
  }
  return user;
}

export async function getCurrentWorkspaceMembership(
  ctx: Ctx,
): Promise<Doc<"workspaceMembers"> | null> {
  const user = await getAppUserOrNull(ctx);
  if (!user) {
    return null;
  }
  return await ctx.db
    .query("workspaceMembers")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();
}

export async function requireWorkspaceMember(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
): Promise<{ membership: Doc<"workspaceMembers">; workspace: Doc<"workspaces"> }> {
  const user = await getAppUser(ctx);
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspaceId_and_userId", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", user._id),
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
