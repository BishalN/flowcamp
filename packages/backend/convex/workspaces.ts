import { v } from "convex/values";

import { getAppUser } from "./appUser";
import { normalizeNameToSlugBase, pickUniqueSlug } from "../lib/slugs";
import { mutation } from "./_generated/server";

export const createFirstWorkspace = mutation({
  args: { name: v.string() },
  returns: v.object({ workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existingMembership) {
      throw new Error("Already in a workspace");
    }
    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new Error("Name is required");
    }
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const taken = new Set(allWorkspaces.map((w) => w.slug));
    const base = normalizeNameToSlugBase(trimmed);
    const slug = pickUniqueSlug(base, taken);
    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: trimmed,
      slug,
      ownerUserId: user._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });
    return { workspaceId };
  },
});
