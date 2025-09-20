import { internalMutation, mutation, query } from "@/convex/_generated/server";
import { Infer, v } from "convex/values";
import { authComponent } from "@/convex/auth";
import { pickDefined } from "@/shared/lib/type-utils";

const ProfileV = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.optional(v.string()),
  name: v.string(),
  email: v.string(),
  personaSummary: v.optional(v.string()),
  personaCategory: v.optional(v.string()),
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

export const createProfile = internalMutation({
  args: {
    userId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    personaSummary: v.optional(v.string()),
    personaCategory: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.id("profiles")),
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      return null;
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      personaSummary: args.personaSummary,
      personaCategory: args.personaCategory,
    });
    return profileId;
  },
});

export const UpdateProfileV = v.object({
  profileId: v.id("profiles"),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  personaSummary: v.optional(v.string()),
  personaCategory: v.optional(v.string()),
});

export const updateProfile = mutation({
  args: UpdateProfileV,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const updates = pickDefined({
      name: args.name,
      email: args.email,
      personaSummary: args.personaSummary,
      personaCategory: args.personaCategory,
    });

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.profileId, updates);
    }

    return null;
  },
});
