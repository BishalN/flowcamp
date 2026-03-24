import { ConvexError, v } from "convex/values";

import { getCurrentWorkspaceMembership, requireWorkspaceMember } from "./appUser";
import { query } from "./_generated/server";
import { projectDocValidator, workspaceDocValidator } from "./validators";

export const get = query({
  args: {},
  returns: v.object({
    workspace: workspaceDocValidator,
    projects: v.array(projectDocValidator),
  }),
  handler: async (ctx) => {
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new ConvexError("Not in a workspace");
    }
    const { workspace } = await requireWorkspaceMember(ctx, membership.workspaceId);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspaceId_and_lastActivityAt", (q) =>
        q.eq("workspaceId", membership.workspaceId),
      )
      .order("desc")
      .collect();
    return {
      workspace,
      projects: projects.filter((project) => project.archivedAt === undefined),
    };
  },
});
