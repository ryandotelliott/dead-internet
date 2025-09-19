import { mutation, query } from "./_generated/server";
import { Infer, v } from "convex/values";
import { authComponent } from "./auth";

export const ProfileV = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.optional(v.string()),
  name: v.string(),
  email: v.string(),
});

export type Profile = Infer<typeof ProfileV>;

export const getCurrentProfile = query({
  args: {},
  returns: v.union(v.null(), ProfileV),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();
    return profile ?? null;
  },
});

export const createProfile = mutation({
  args: {
    userId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      return existingProfile._id;
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: args.userId,
      name: args.name,
      email: args.email,
    });
    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.email !== undefined ? { email: args.email } : {}),
    });
    return null;
  },
});
