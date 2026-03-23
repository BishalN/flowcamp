import { v } from "convex/values";

import { getCurrentWorkspaceMembership, requireAuthUserId } from "./appUser";
import { normalizeNameToSlugBase, pickUniqueSlug } from "../lib/slugs";
import { mutation } from "./_generated/server";

export const createWorkspace = mutation({
  args: { name: v.string() },
  returns: v.object({ workspaceId: v.id("workspaces") }),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const existingMembership = await getCurrentWorkspaceMembership(ctx);
    if (existingMembership) {
      throw new Error("Already in a workspace");
    }
    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new Error("Name is required");
    }

    // TODO: use some simpler approach here, maybe use a slug generator library
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const taken = new Set(allWorkspaces.map((w) => w.slug));
    const base = normalizeNameToSlugBase(trimmed);
    const slug = pickUniqueSlug(base, taken);
    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: trimmed,
      slug,
      ownerAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      authUserId,
      role: "owner",
      joinedAt: now,
    });
    return { workspaceId };
  },
});
