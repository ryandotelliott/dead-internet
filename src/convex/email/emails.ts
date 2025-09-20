import {
  internalMutation,
  mutation,
  query,
  internalQuery,
} from "@/convex/_generated/server";
import { v, Infer } from "convex/values";
import { DataModel, Doc, Id } from "@/convex/_generated/dataModel";
import { authComponent } from "@/convex/auth";
import { GenericMutationCtx } from "convex/server";
import { internal } from "@/convex/_generated/api";

const MailboxFolderV = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("trash"),
);

const MailboxEntryV = v.object({
  _id: v.id("mailboxEntries"),
  _creationTime: v.number(),
  senderProfileId: v.id("profiles"),
  ownerProfileId: v.id("profiles"),
  emailId: v.id("emails"),
  role: v.union(v.literal("to"), v.literal("cc")),
  folder: MailboxFolderV,
  read: v.boolean(),
  subject: v.string(),

  // Sender derived fields
  senderName: v.string(),
  senderEmail: v.string(),

  // Email derived fields
  body: v.string(),
});

export type MailboxEntry = Infer<typeof MailboxEntryV>;

export const listMailboxEntries = query({
  args: { folder: MailboxFolderV },
  returns: v.array(MailboxEntryV),
  async handler(ctx, args) {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile: Doc<"profiles"> | null = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const entries: Array<Doc<"mailboxEntries">> = await ctx.db
      .query("mailboxEntries")
      .withIndex("byOwnerFolder", (q) =>
        q.eq("ownerProfileId", profile._id).eq("folder", args.folder),
      )
      .order("desc")
      .take(50);

    const out: Array<MailboxEntry> = [];
    for (const entry of entries) {
      const senderProfile: Doc<"profiles"> | null = await ctx.db.get(
        entry.senderProfileId,
      );

      if (!senderProfile) {
        console.error("Sender profile not found", entry.senderProfileId);
        continue;
      }

      const email: Doc<"emails"> | null = await ctx.db.get(entry.emailId);

      if (!email) {
        console.error("Email not found", entry.emailId);
        continue;
      }

      out.push({
        ...entry,
        senderName: senderProfile.name,
        senderEmail: senderProfile.email,
        body: email.body,
      });
    }
    return out;
  },
});

const NewEmailV = v.object({
  senderProfileId: v.id("profiles"),
  toProfileIds: v.array(v.id("profiles")),
  subject: v.string(),
  body: v.string(),
  threadId: v.optional(v.string()),
});

// Shared helper to write the email and mailbox entries
async function writeEmailAndEntries(
  ctx: GenericMutationCtx<DataModel>,
  params: Infer<typeof NewEmailV>,
): Promise<Id<"emails">> {
  const emailId: Id<"emails"> = await ctx.db.insert("emails", {
    senderProfileId: params.senderProfileId,
    subject: params.subject,
    body: params.body,
    threadId: params.threadId ?? crypto.randomUUID(),
  });

  await ctx.db.insert("mailboxEntries", {
    senderProfileId: params.senderProfileId,
    ownerProfileId: params.senderProfileId,
    emailId,
    role: "to",
    folder: "sent",
    read: true,
    subject: params.subject,
  });

  for (const recipientId of params.toProfileIds) {
    await ctx.db.insert("mailboxEntries", {
      senderProfileId: params.senderProfileId,
      ownerProfileId: recipientId,
      emailId,
      role: "to",
      folder: "inbox",
      read: false,
      subject: params.subject,
    });
  }

  return emailId;
}

export const sendEmail = mutation({
  args: v.object({
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    threadId: v.optional(v.string()),
  }),
  returns: v.object({ emailId: v.id("emails") }),
  async handler(ctx, args): Promise<{ emailId: Id<"emails"> }> {
    const user = await authComponent.getAuthUser(ctx);

    if (!args.to.length) {
      throw new Error("Recipients are required");
    }

    const senderProfile: Doc<"profiles"> | null = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();

    if (!senderProfile) {
      throw new Error("Sender profile not found");
    }

    const toProfileIds: Array<Id<"profiles">> = [];
    for (const recipientEmail of args.to) {
      const existingRecipient: Doc<"profiles"> | null = await ctx.db
        .query("profiles")
        .withIndex("byEmail", (q) => q.eq("email", recipientEmail))
        .unique();

      // TODO: Create a new profile if not found
      if (!existingRecipient) {
        console.warn("Recipient profile not found", recipientEmail);
        continue;
      }

      toProfileIds.push(existingRecipient._id);
    }

    const emailId = await writeEmailAndEntries(ctx, {
      senderProfileId: senderProfile._id,
      toProfileIds,
      subject: args.subject,
      body: args.body,
      threadId: args.threadId,
    });

    // Trigger agent replies asynchronously
    await ctx.scheduler.runAfter(
      0,
      internal.email.orchestrator.generateAgentReplies,
      { emailId },
    );

    return { emailId };
  },
});

export const markMailboxEntryRead = mutation({
  args: { mailboxEntryId: v.id("mailboxEntries"), read: v.boolean() },
  returns: v.null(),
  async handler(ctx, args): Promise<null> {
    const user = await authComponent.getAuthUser(ctx);

    const myProfile: Doc<"profiles"> | null = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();

    if (!myProfile) {
      throw new Error("Profile not found for user");
    }

    const entry = await ctx.db.get(args.mailboxEntryId);
    if (!entry) {
      throw new Error("Mailbox entry not found");
    }
    if (entry.ownerProfileId !== myProfile._id) {
      throw new Error("Cannot modify an entry you don't own");
    }

    await ctx.db.patch(args.mailboxEntryId, { read: args.read });
    return null;
  },
});

/**
 * Write an email directly to bypass auth checks; used for agent-generated emails.
 */
export const writeDirect = internalMutation({
  args: NewEmailV,
  returns: v.object({ emailId: v.id("emails") }),
  async handler(ctx, args) {
    const emailId = await writeEmailAndEntries(ctx, {
      senderProfileId: args.senderProfileId,
      toProfileIds: args.toProfileIds,
      subject: args.subject,
      body: args.body,
      threadId: args.threadId,
    });

    return { emailId };
  },
});

const RecipientInfoV = v.object({
  _id: v.id("profiles"),
  userId: v.optional(v.string()),
  email: v.string(),
  name: v.string(),
});
type RecipientInfo = Infer<typeof RecipientInfoV>;

// Internal helper query to fetch email details and recipients
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
      const profile = await ctx.db.get(email.senderProfileId);
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
