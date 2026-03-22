import { v } from "convex/values";

import { getAppUser, requireWorkspaceMember } from "./appUser";
import { query } from "./_generated/server";

const workspaceSummaryValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  ownerUserId: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const projectDocValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  createdByUserId: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastActivityAt: v.number(),
  archivedAt: v.optional(v.number()),
});

const PRIMARY_LIMIT = 6;

export const get = query({
  args: {},
  returns: v.object({
    workspace: workspaceSummaryValidator,
    primaryProjects: v.array(projectDocValidator),
    secondaryProjects: v.array(projectDocValidator),
    assignedOpenTodos: v.array(v.object({ id: v.string(), title: v.string() })),
    overdueTodos: v.array(v.object({ id: v.string(), title: v.string() })),
    schedulePreview: v.null(),
  }),
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    const { workspace } = await requireWorkspaceMember(ctx, membership.workspaceId);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspaceId_and_lastActivityAt", (q) =>
        q.eq("workspaceId", membership.workspaceId),
      )
      .order("desc")
      .collect();
    const active = projects.filter((p) => p.archivedAt === undefined);
    const primaryProjects = active.slice(0, PRIMARY_LIMIT);
    const secondaryProjects = active.slice(PRIMARY_LIMIT);
    return {
      workspace,
      primaryProjects,
      secondaryProjects,
      assignedOpenTodos: [],
      overdueTodos: [],
      schedulePreview: null,
    };
  },
});
