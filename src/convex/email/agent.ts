import { api, components, internal } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { z } from "zod";
import { Profile } from "@/convex/profile/profiles";
import dedent from "ts-dedent";

const emailAgent = new Agent(components.agent, {
  name: "emailAgent",
  languageModel: openai.chat("gpt-5-mini"),
});

export const ensureThread = internalAction({
  args: { emailThreadId: v.string(), agentProfileId: v.id("profiles") },
  returns: v.object({ agentThreadId: v.string() }),
  handler: async (ctx, args): Promise<{ agentThreadId: string }> => {
    const existing: { agentThreadId: string } | null = await ctx.runQuery(
      internal.email.agentThreads.getAgentThread,
      args,
    );

    if (existing) return existing;

    const { threadId } = await emailAgent.createThread(ctx, {
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

const EmailSchema = z.object({
  subject: z
    .string()
    .min(1)
    .max(120)
    .describe(
      "Concise, plausible corporate subject (no quotes, no brackets, no emojis).",
    ),
  body: z
    .string()
    .min(1)
    .max(4000)
    .describe(
      "Plain-text email in an uncanny corporate tone. No markdown. One subtle anomaly allowed (e.g., obsolete jargon or a harmless [REDACTED]).",
    ),
});

export const create = internalAction({
  args: {
    agentProfileId: v.id("profiles"),
    recipients: v.array(v.string()),
  },
  returns: v.object({
    threadId: v.string(),
    subject: v.string(),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!args.recipients.length) {
      throw new Error("Recipients are required");
    }

    const sender: Profile | null = await ctx.runQuery(
      api.profile.profiles.getProfileById,
      {
        profileId: args.agentProfileId,
      },
    );

    if (!sender) {
      throw new Error("Sender profile not found");
    }

    const { thread, threadId } = await emailAgent.createThread(ctx, {
      userId: args.agentProfileId,
    });

    const result: { object: { subject: string; body: string } } =
      await thread.generateObject({
        schema: EmailSchema,
        system:
          "You simulate an aging enterprise mail client within a dead-internet corporate network. Draft emails that are plausible and precise with a faint bureaucratic eeriness.",
        prompt: [
          {
            role: "system",
            content: dedent(
              `Compose an initial outreach email in the DeadNet style.
              Sender:
              - Name: ${sender.name}
              - Email: ${sender.email}
              ${sender.personaSummary ? `- Summary: ${sender.personaSummary}\n` : ""}
              Recipients (emails only):
              ${args.recipients.map((r) => `- ${r}`).join("\n")}
              Constraints:
              - Keep it brief and task-oriented.
              - Corporate tone with softened euphemisms; avoid warmth and jokes.
              - Subtle strangeness permitted, but remain coherent and useful.
              - No markdown, no bullets, no meta-references.
              - Include a simple sign-off with the sender's name.`,
            ),
          },
        ],
      });

    const { subject, body } = result.object;
    return { threadId, subject, body };
  },
});

export const reply = internalAction({
  args: {
    agentProfileId: v.id("profiles"),
    threadId: v.string(),
    emailThreadId: v.string(),
  },
  returns: v.object({ subject: v.string(), body: v.string() }),
  handler: async (ctx, args) => {
    if (!args.threadId) {
      throw new Error("Thread ID is required");
    }

    const sender: Profile | null = await ctx.runQuery(
      api.profile.profiles.getProfileById,
      {
        profileId: args.agentProfileId,
      },
    );

    if (!sender) {
      throw new Error("Sender profile not found");
    }

    const { thread } = await emailAgent.continueThread(ctx, {
      threadId: args.threadId,
      userId: args.agentProfileId,
    });

    // Load recent conversation context from the canonical email thread
    const threadContext = await ctx.runQuery(
      internal.email.threads.getThreadContext,
      { emailThreadId: args.emailThreadId, limit: 10 },
    );

    const contextLines: Array<string> = threadContext.messages.map(
      (m: { authorName: string; authorEmail: string; body: string }) => {
        return `${m.authorName} <${m.authorEmail}>: ${m.body}`;
      },
    );

    const result: { object: { subject: string; body: string } } =
      await thread.generateObject({
        schema: EmailSchema.omit({ subject: true }),
        system:
          "You simulate an aging enterprise mail client within a dead-internet corporate network. Replies should be concise, procedural, and faintly uncanny.",
        prompt: [
          {
            role: "system",
            content:
              "Draft a short reply to the latest message in this thread. Maintain coherence and allow one subtle anomaly at most.",
          },
          {
            role: "system",
            content: `Sender for sign-off: ${sender.name}`,
          },
          {
            role: "system",
            content: `Subject: ${threadContext.subject || "(no subject)"}`,
          },
          {
            role: "user",
            content:
              "Conversation context (oldest to newest):\n" +
              contextLines.join("\n"),
          },
        ],
      });

    const { subject, body } = result.object;
    return { subject, body };
  },
});
