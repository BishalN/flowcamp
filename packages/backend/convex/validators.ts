import { v } from "convex/values";

export const workspaceDocValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  ownerAuthUserId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const projectDocValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  createdByAuthUserId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastActivityAt: v.number(),
  archivedAt: v.optional(v.number()),
});

export const todoListDocValidator = v.object({
  _id: v.id("todoLists"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  projectId: v.id("projects"),
  name: v.string(),
  createdByAuthUserId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const todoStatusValidator = v.union(v.literal("open"), v.literal("completed"));

export const todoDocValidator = v.object({
  _id: v.id("todos"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  projectId: v.id("projects"),
  listId: v.id("todoLists"),
  title: v.string(),
  descriptionMarkdown: v.optional(v.string()),
  status: todoStatusValidator,
  assigneeAuthUserId: v.optional(v.string()),
  dueAt: v.optional(v.number()),
  dueDateKey: v.optional(v.string()),
  createdByAuthUserId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const todoCommentDocValidator = v.object({
  _id: v.id("todoComments"),
  _creationTime: v.number(),
  todoId: v.id("todos"),
  authorAuthUserId: v.string(),
  bodyMarkdown: v.string(),
  createdAt: v.number(),
});
