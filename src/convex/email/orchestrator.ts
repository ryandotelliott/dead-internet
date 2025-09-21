import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
      const isAgent = recipient.userId == undefined; // no userId => agent persona

      console.log("isAgent for recipient", recipient.email, isAgent);
      if (!isAgent) continue;

      console.log("Ensuring thread for agent", recipient._id);
      // Ensure mapping to an agent conversation thread
      const ensured = await ctx.runAction(internal.email.agent.ensureThread, {
        emailThreadId: email.threadId,
        agentProfileId: recipient._id,
      });

      console.log("Ensured thread for agent", recipient._id, ensured);

      // Ask the agent to reply in its own conversation thread
      const reply = await ctx.runAction(internal.email.agent.reply, {
        agentProfileId: recipient._id,
        threadId: ensured.agentThreadId,
        emailThreadId: email.threadId,
      });

      console.log("Replied to agent", recipient._id, reply);

      // Write agent's reply back into the same email thread
      await ctx.runMutation(internal.email.emails.writeDirect, {
        senderProfileId: recipient._id,
        toProfileIds: [email.senderProfileId],
        subject: email.subject,
        body: reply.body,
        threadId: email.threadId,
      });
    }

    return null;
  },
});

// Ensure recipients exist with personas, then write email and schedule replies.
export const ensureRecipientsExist = internalAction({
  args: {
    senderProfileId: v.id("profiles"),
    recipients: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    threadId: v.optional(v.string()),
  },
  returns: v.object({ emailId: v.id("emails") }),
  handler: async (ctx, args): Promise<{ emailId: Id<"emails"> }> => {
    const uniqueRecipients: Array<string> = Array.from(
      new Set(args.recipients),
    );

    const toProfileIds: Array<Id<"profiles">> = [];
    for (const recipientEmail of uniqueRecipients) {
      const existing = await ctx.runQuery(api.profile.profiles.getByEmail, {
        email: recipientEmail,
      });

      let profileId: Id<"profiles">;
      let needsPersona = false;

      if (existing) {
        profileId = existing._id;
        needsPersona = !existing.personaSummary || existing.name.length === 0;
      } else {
        profileId = await ctx.runMutation(
          internal.profile.profiles.ensureByEmail,
          { email: recipientEmail },
        );
        needsPersona = true;
      }

      if (needsPersona) {
        await ctx.runAction(internal.profile.agent.generatePersonaForProfile, {
          profileId,
          emailAddress: recipientEmail,
          emailBody: args.body,
        });
      }

      toProfileIds.push(profileId);
    }

    const { emailId } = await ctx.runMutation(
      internal.email.emails.writeDirect,
      {
        senderProfileId: args.senderProfileId,
        toProfileIds,
        subject: args.subject,
        body: args.body,
        threadId: args.threadId,
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.email.orchestrator.generateAgentReplies,
      { emailId },
    );

    return { emailId };
  },
});
