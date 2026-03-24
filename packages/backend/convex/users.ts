import { v } from "convex/values";

import { authComponent } from "./auth";
import { getCurrentWorkspaceMembership, requireAuthUserId } from "./appUser";
import { query } from "./_generated/server";

const membershipDocValidator = v.object({
  _id: v.id("workspaceMembers"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  authUserId: v.string(),
  role: v.union(v.literal("owner"), v.literal("member")),
  joinedAt: v.number(),
});

const workspaceDocValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  ownerAuthUserId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getOnboardingState = query({
  args: {},
  returns: v.object({
    authUserId: v.string(),
    authUser: v.union(
      v.object({
        id: v.string(),
        email: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
      }),
      v.null(),
    ),
    membership: v.union(membershipDocValidator, v.null()),
    workspace: v.union(workspaceDocValidator, v.null()),
    needsWorkspaceCreation: v.boolean(),
    canAcceptInvite: v.boolean(),
  }),
  handler: async (ctx) => {
    // TODO: do we need to have both; authUserId and authUser? aren't they same; I think convex caches them so, It might not be a problem to call it again
    const authUserId = await requireAuthUserId(ctx);
    const authUser = await authComponent.safeGetAuthUser(ctx);
    const membership = await getCurrentWorkspaceMembership(ctx);
    const workspace = membership !== null ? await ctx.db.get(membership.workspaceId) : null;
    return {
      authUserId,
      authUser: authUser
        ? {
            id: String(authUser._id),
            email: authUser.email,
            name: authUser.name,
            image: authUser.image ?? undefined,
          }
        : null,
      membership,
      workspace,
      needsWorkspaceCreation: membership === null,
      canAcceptInvite: membership === null,
    };
  },
});
