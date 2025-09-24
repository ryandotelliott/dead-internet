import { internalQuery, query, QueryCtx } from "@/convex/_generated/server";
import { v, Infer } from "convex/values";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

// Recipient info for an email
const RecipientInfoV = v.object({
  _id: v.id("profiles"),
  userId: v.optional(v.string()),
  email: v.string(),
  name: v.string(),
});
type RecipientInfo = Infer<typeof RecipientInfoV>;

// Fetch a single email's details and recipient list
export const getEmailDetails = query({
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
      if (entry.ownerProfileId !== email.senderProfileId) {
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
  recipients: v.array(RecipientInfoV),
});
type ThreadContextMessage = Infer<typeof ThreadContextMessageV>;

async function buildThreadContext(
  ctx: QueryCtx,
  args: { emailThreadId: string; limit?: number },
): Promise<{
  threadId: string;
  subject: string;
  messages: Array<ThreadContextMessage>;
}> {
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
    const senderProfile: Doc<"profiles"> | null = await ctx.db.get(
      email.senderProfileId,
    );
    if (!senderProfile) continue;

    // Compute recipients for this email by looking at mailbox entries on that email
    const relatedEntries = await ctx.db
      .query("mailboxEntries")
      .withIndex("byEmail", (q) => q.eq("emailId", email._id))
      .collect();

    const recipientIds = new Set<Id<"profiles">>();
    for (const entry of relatedEntries) {
      if (entry.ownerProfileId !== email.senderProfileId) {
        recipientIds.add(entry.ownerProfileId);
      }
    }

    const recipients: Array<RecipientInfo> = [];
    for (const pid of recipientIds) {
      const profile = await ctx.db.get(pid);
      if (profile) {
        recipients.push({
          _id: profile._id,
          userId: profile.userId,
          email: profile.email,
          name: profile.name,
        });
      }
    }

    messages.push({
      authorProfileId: senderProfile._id,
      authorName: senderProfile.name,
      authorEmail: senderProfile.email,
      body: email.body,
      timestamp: email._creationTime,
      recipients,
    });
  }

  const subject = emailsInThread[emailsInThread.length - 1].subject;
  return { threadId: args.emailThreadId, subject, messages };
}

// Compute thread context without auth checks (usable by agents)
export const getThreadContextInternal = internalQuery({
  args: { emailThreadId: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    threadId: v.string(),
    subject: v.string(),
    messages: v.array(ThreadContextMessageV),
  }),
  async handler(ctx, args) {
    return await buildThreadContext(ctx, args);
  },
});

export const getThreadContext = query({
  args: { emailThreadId: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    threadId: v.string(),
    subject: v.string(),
    messages: v.array(ThreadContextMessageV),
  }),
  async handler(ctx, args) {
    const profile = await ctx.runQuery(api.profile.profiles.getCurrent, {});
    if (!profile) {
      throw new Error("Profile not found for user");
    }

    // Verify at least one mailbox entry exists in this thread for the user
    const hasAccess = await ctx.db
      .query("mailboxEntries")
      .withIndex("byOwner", (q) => q.eq("ownerProfileId", profile._id))
      // Post-filter by threadId since there's no compound index
      .filter((q) => q.eq(q.field("threadId"), args.emailThreadId))
      .take(1);

    if (hasAccess.length === 0) {
      throw new Error("Not authorized to view this thread");
    }

    return await buildThreadContext(ctx, args);
  },
});
