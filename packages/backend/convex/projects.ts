import { v } from "convex/values";

import { getAppUser, requireWorkspaceMember } from "./appUser";
import { normalizeNameToSlugBase, pickUniqueSlug } from "../lib/slugs";
import { mutation, query } from "./_generated/server";

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

const toolCardValidator = v.object({
  id: v.string(),
  label: v.string(),
  href: v.string(),
});

const STATIC_TOOLS = [
  { id: "overview", label: "Overview", href: "overview" },
  { id: "todos", label: "Todos", href: "todos" },
  { id: "messages", label: "Messages", href: "messages" },
  { id: "chat", label: "Chat", href: "chat" },
  { id: "docs", label: "Docs", href: "docs" },
  { id: "files", label: "Files", href: "files" },
] as const;

const DEFERRED_TOOLS = [{ id: "schedule", label: "Schedule", href: "schedule" }] as const;

export const list = query({
  args: {},
  returns: v.array(projectDocValidator),
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
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
    const user = await getAppUser(ctx);
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
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
      createdByUserId: user._id,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
    return { projectId };
  },
});

export const getShell = query({
  args: { projectId: v.id("projects") },
  returns: v.object({
    project: projectDocValidator,
    workspace: workspaceSummaryValidator,
    role: v.union(v.literal("owner"), v.literal("member")),
    tools: v.array(toolCardValidator),
    deferredTools: v.array(toolCardValidator),
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
      tools: [...STATIC_TOOLS],
      deferredTools: [...DEFERRED_TOOLS],
    };
  },
});
