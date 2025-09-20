import { internalQuery, internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const getAgentThread = internalQuery({
  args: { emailThreadId: v.string(), agentProfileId: v.id("profiles") },
  returns: v.union(v.null(), v.object({ agentThreadId: v.string() })),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("agentThreads")
      .withIndex("byEmailThreadAndAgent", (q) =>
        q
          .eq("emailThreadId", args.emailThreadId)
          .eq("agentProfileId", args.agentProfileId),
      )
      .unique();
    return row ? { agentThreadId: row.agentThreadId } : null;
  },
});

export const link = internalMutation({
  args: {
    emailThreadId: v.string(),
    agentProfileId: v.id("profiles"),
    agentThreadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentThreads")
      .withIndex("byEmailThreadAndAgent", (q) =>
        q
          .eq("emailThreadId", args.emailThreadId)
          .eq("agentProfileId", args.agentProfileId),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("agentThreads", args);
    }
    return null;
  },
});
