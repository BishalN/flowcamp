import { v } from "convex/values";

import { getCurrentWorkspaceMembership, requireAuthUserId, requireWorkspaceMember } from "./appUser";
import { normalizeNameToSlugBase, pickUniqueSlug } from "../lib/slugs";
import { mutation, query } from "./_generated/server";
import { projectDocValidator, workspaceDocValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(projectDocValidator),
  handler: async (ctx) => {
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspaceId_and_lastActivityAt", (q) =>
        q.eq("workspaceId", membership.workspaceId),
      )
      .order("desc")
      .collect();
    return projects.filter((p) => p.archivedAt === undefined);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({ projectId: v.id("projects") }),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const membership = await getCurrentWorkspaceMembership(ctx);
    if (!membership) {
      throw new Error("Not in a workspace");
    }
    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new Error("Name is required");
    }
    const workspaceId = membership.workspaceId;
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const taken = new Set(existing.map((p) => p.slug));
    const base = normalizeNameToSlugBase(trimmed);
    const slug = pickUniqueSlug(base, taken);
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      workspaceId,
      name: trimmed,
      slug,
      description: args.description?.trim() || undefined,
      createdByAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
    return { projectId };
  },
});

export const getProjectAccessContext = query({
  args: { projectId: v.id("projects") },
  returns: v.object({
    project: projectDocValidator,
    workspace: workspaceDocValidator,
    role: v.union(v.literal("owner"), v.literal("member")),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const { membership, workspace } = await requireWorkspaceMember(ctx, project.workspaceId);
    return {
      project,
      workspace,
      role: membership.role,
    };
  },
});
