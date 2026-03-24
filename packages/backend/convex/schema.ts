import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerAuthUserId", ["ownerAuthUserId"])
    .index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    authUserId: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_authUserId", ["authUserId"])
    .index("by_workspaceId_and_authUserId", ["workspaceId", "authUserId"]),

  workspaceInvites: defineTable({
    workspaceId: v.id("workspaces"),
    createdByAuthUserId: v.string(),
    tokenHash: v.string(),
    role: v.literal("member"),
    status: v.union(v.literal("active"), v.literal("revoked"), v.literal("consumed")),
    expiresAt: v.number(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
    consumedAt: v.optional(v.number()),
    consumedByAuthUserId: v.optional(v.string()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_status", ["workspaceId", "status"])
    .index("by_tokenHash", ["tokenHash"]),

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_lastActivityAt", ["workspaceId", "lastActivityAt"])
    .index("by_workspaceId_and_slug", ["workspaceId", "slug"]),

  todoLists: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    name: v.string(),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_projectId", ["projectId"]),

  todos: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    listId: v.id("todoLists"),
    title: v.string(),
    descriptionMarkdown: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("completed")),
    assigneeAuthUserId: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    dueDateKey: v.optional(v.string()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_projectId_and_status", ["projectId", "status"])
    .index("by_projectId_and_assigneeAuthUserId_and_status", [
      "projectId",
      "assigneeAuthUserId",
      "status",
    ])
    .index("by_assigneeAuthUserId_and_status", ["assigneeAuthUserId", "status"])
    .index("by_assigneeAuthUserId_and_status_and_dueDateKey", [
      "assigneeAuthUserId",
      "status",
      "dueDateKey",
    ])
    .index("by_listId", ["listId"]),

  todoComments: defineTable({
    todoId: v.id("todos"),
    authorAuthUserId: v.string(),
    bodyMarkdown: v.string(),
    createdAt: v.number(),
  }).index("by_todoId", ["todoId"]),
});
