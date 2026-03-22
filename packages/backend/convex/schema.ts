import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_userId", ["userId"])
    .index("by_workspaceId_and_userId", ["workspaceId", "userId"]),

  workspaceInvites: defineTable({
    workspaceId: v.id("workspaces"),
    createdByUserId: v.id("users"),
    tokenHash: v.string(),
    role: v.literal("member"),
    status: v.union(v.literal("active"), v.literal("revoked"), v.literal("consumed")),
    expiresAt: v.number(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
    consumedAt: v.optional(v.number()),
    consumedByUserId: v.optional(v.id("users")),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_status", ["workspaceId", "status"])
    .index("by_tokenHash", ["tokenHash"]),

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_lastActivityAt", ["workspaceId", "lastActivityAt"])
    .index("by_workspaceId_and_slug", ["workspaceId", "slug"]),
});
