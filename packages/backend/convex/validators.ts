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
