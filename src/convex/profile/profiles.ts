import { internalMutation, mutation, query } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";
import { Infer, v } from "convex/values";
import { authComponent } from "@/convex/auth";
import { pickDefined } from "@/shared/lib/type-utils";
import { Id } from "../_generated/dataModel";

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

export const getCurrent = query({
  args: {},
  returns: v.union(v.null(), ProfileV),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();
    return profile ?? null;
  },
});

export const getProfileById = query({
  args: { profileId: v.id("profiles") },
  returns: v.union(v.null(), ProfileV),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    return profile;
  },
});

export const create = internalMutation({
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
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
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

export const update = mutation({
  args: UpdateProfileV,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
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

// Internal helper used by background jobs/triggers to set persona fields
export const setPersona = internalMutation({
  args: {
    profileId: v.id("profiles"),
    personaSummary: v.string(),
    personaCategory: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      personaSummary: args.personaSummary,
      personaCategory: args.personaCategory,
    });
    return null;
  },
});

// Enqueue persona generation action from safe runtime
export const enqueuePersonaGeneration = internalMutation({
  args: {
    profileId: v.id("profiles"),
    context: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.profile.agent.generatePersonaForProfile,
      {
        profileId: args.profileId,
        context: args.context,
      },
    );
    return null;
  },
});

export const orchestrateOnboarding = internalMutation({
  args: {
    userProfileId: v.id("profiles"),
    numAgents: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const numAgents = args.numAgents ?? 2;

    // 1) Create bare agent profiles, then schedule the persona generation for each
    const agentProfileIds: Array<Id<"profiles">> = [];
    for (let i = 0; i < numAgents; i++) {
      const agentProfileId = await ctx.db.insert("profiles", {
        name: "", // will be filled by persona agent
        email: `agent+${Date.now()}_${i}@deadnet.com`,
        personaSummary: undefined,
        personaCategory: undefined,
      });
      agentProfileIds.push(agentProfileId);
      await ctx.scheduler.runAfter(
        0,
        internal.profile.agent.generatePersonaForProfile,
        { profileId: agentProfileId },
      );
    }

    // 2) Seed initial emails from each agent to the user
    for (const agentId of agentProfileIds) {
      await ctx.runMutation(internal.email.emails.writeDirect, {
        senderProfileId: agentId,
        toProfileIds: [args.userProfileId],
        subject: "Onboarding: Initial Notice",
        body: "Welcome to DeadNet. This is an automated orientation notice. Please review attached procedures and escalate if necessary.",
        threadId: "",
      });
    }

    return null;
  },
});
