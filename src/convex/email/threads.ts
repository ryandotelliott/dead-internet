import { internalQuery } from "@/convex/_generated/server";
import { v, Infer } from "convex/values";
import { Id, Doc } from "@/convex/_generated/dataModel";

const RecipientInfoV = v.object({
  _id: v.id("profiles"),
  userId: v.optional(v.string()),
  email: v.string(),
  name: v.string(),
});
type RecipientInfo = Infer<typeof RecipientInfoV>;

export const getEmailDetails = internalQuery({
  args: { emailId: v.id("emails") },
  returns: v.union(
    v.null(),
    v.object({
      email: v.object({
        _id: v.id("emails"),
        senderProfileId: v.id("profiles"),
        subject: v.string(),
        body: v.string(),
        threadId: v.string(),
      }),
      recipients: v.array(RecipientInfoV),
    }),
  ),
  async handler(ctx, args) {
    const email = await ctx.db.get(args.emailId);
    if (!email) return null;

    // collect all mailbox entries for this email and resolve owners
    const entries = await ctx.db
      .query("mailboxEntries")
      .withIndex("byEmail", (q) => q.eq("emailId", args.emailId))
      .collect();

    const recipientIds = new Set<Id<"profiles">>();
    for (const entry of entries) {
      if (
        entry.ownerProfileId !== email.senderProfileId &&
        entry.role === "to"
      ) {
        recipientIds.add(entry.ownerProfileId);
      }
    }

    const recipients: Array<RecipientInfo> = [];
    for (const profileId of recipientIds) {
      const profile = await ctx.db.get(profileId);
      if (profile) {
        recipients.push({
          _id: profile._id,
          userId: profile.userId,
          email: profile.email,
          name: profile.name,
        });
      }
    }

    return {
      email: {
        _id: email._id,
        senderProfileId: email.senderProfileId,
        subject: email.subject,
        body: email.body,
        threadId: email.threadId,
      },
      recipients,
    };
  },
});

const ThreadContextMessageV = v.object({
  authorProfileId: v.id("profiles"),
  authorName: v.string(),
  authorEmail: v.string(),
  body: v.string(),
  timestamp: v.number(),
});
type ThreadContextMessage = Infer<typeof ThreadContextMessageV>;

// Returns recent messages from an email thread with sender labels for LLM context
export const getThreadContext = internalQuery({
  args: { emailThreadId: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    threadId: v.string(),
    subject: v.string(),
    messages: v.array(
      v.object({
        authorProfileId: v.id("profiles"),
        authorName: v.string(),
        authorEmail: v.string(),
        body: v.string(),
        timestamp: v.number(),
      }),
    ),
  }),
  async handler(ctx, args) {
    const emailsInThread = await ctx.db
      .query("emails")
      .withIndex("byThread", (q) => q.eq("threadId", args.emailThreadId))
      .order("asc")
      .collect();

    if (emailsInThread.length === 0) {
      throw new Error("No emails found in thread");
    }

    const limit = args.limit ?? 20;
    const startIdx = Math.max(0, emailsInThread.length - limit);
    const recent = emailsInThread.slice(startIdx);

    const messages: Array<ThreadContextMessage> = [];

    for (const email of recent) {
      const profile: Doc<"profiles"> | null = await ctx.db.get(
        email.senderProfileId,
      );
      if (!profile) continue;
      messages.push({
        authorProfileId: profile._id,
        authorName: profile.name,
        authorEmail: profile.email,
        body: email.body,
        timestamp: email._creationTime,
      });
    }

    const subject = emailsInThread[emailsInThread.length - 1].subject;
    return { threadId: args.emailThreadId, subject, messages };
  },
});
