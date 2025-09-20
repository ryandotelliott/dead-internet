import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal, components } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
  name: "emailAgent",
  languageModel: openai.chat("gpt-5-mini"),
});

export const ensureAgentThread = internalAction({
  args: { emailThreadId: v.string(), agentProfileId: v.id("profiles") },
  returns: v.object({ agentThreadId: v.string() }),
  handler: async (ctx, args): Promise<{ agentThreadId: string }> => {
    const existing: { agentThreadId: string } | null = await ctx.runQuery(
      internal.email.agentThreads.getAgentThread,
      args,
    );
    if (existing) return existing;

    const { threadId } = await agent.createThread(ctx, {
      userId: args.agentProfileId,
    });

    await ctx.runMutation(internal.email.agentThreads.link, {
      emailThreadId: args.emailThreadId,
      agentProfileId: args.agentProfileId,
      agentThreadId: threadId,
    });

    return { agentThreadId: threadId };
  },
});
