import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

// Orchestrate generating replies from agent recipients for a just-sent email
export const generateAgentReplies = internalAction({
  args: { emailId: v.id("emails") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const details = await ctx.runQuery(internal.email.threads.getEmailDetails, {
      emailId: args.emailId,
    });
    if (!details) return null;

    const { email, recipients } = details;

    // TODO: Need to "intelligently" determine who should reply. Otherwise, topics with more than one agent will spiral.
    // Potentially, we could pass all recipients to the LLM and it will draft replies for everyone that's appropriate.
    for (const recipient of recipients) {
      const isAgent = recipient.userId === null; // no userId => agent persona
      if (!isAgent) continue;

      // Ensure mapping to an agent conversation thread
      const ensured = await ctx.runAction(internal.email.agent.ensureThread, {
        emailThreadId: email.threadId,
        agentProfileId: recipient._id,
      });

      // Ask the agent to reply in its own conversation thread
      const reply = await ctx.runAction(internal.email.agent.reply, {
        agentProfileId: recipient._id,
        threadId: ensured.agentThreadId,
        emailThreadId: email.threadId,
      });

      // Write agent's reply back into the same email thread
      await ctx.runMutation(internal.email.emails.writeDirect, {
        senderProfileId: recipient._id,
        toProfileIds: [email.senderProfileId],
        subject: reply.subject,
        body: reply.body,
        threadId: email.threadId,
      });
    }

    return null;
  },
});
