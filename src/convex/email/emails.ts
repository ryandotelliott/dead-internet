import { internalMutation, mutation } from "@/convex/_generated/server";
import { v, Infer } from "convex/values";
import { DataModel, Id } from "@/convex/_generated/dataModel";
import { GenericMutationCtx } from "convex/server";
import { api, internal } from "@/convex/_generated/api";

export const MailboxFolderV = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("trash"),
);

export const MailboxEntryV = v.object({
  _id: v.id("mailboxEntries"),
  _creationTime: v.number(),
  senderProfileId: v.id("profiles"),
  ownerProfileId: v.id("profiles"),
  emailId: v.id("emails"),
  folder: MailboxFolderV,
  isRead: v.boolean(),
  subject: v.string(),

  // Sender derived fields
  senderName: v.string(),
  senderEmail: v.string(),

  // Email derived fields
  body: v.string(),
  recipients: v.array(
    v.object({
      name: v.string(),
      email: v.string(),
    }),
  ),
  threadId: v.string(),
});

export type MailboxEntry = Infer<typeof MailboxEntryV>;

const NewEmailV = v.object({
  senderProfileId: v.id("profiles"),
  toProfileIds: v.array(v.id("profiles")),
  subject: v.string(),
  body: v.string(),
  threadId: v.optional(v.string()),
});

async function writeEmailAndEntries(
  ctx: GenericMutationCtx<DataModel>,
  params: Infer<typeof NewEmailV>,
): Promise<Id<"emails">> {
  const threadId = params.threadId ?? crypto.randomUUID();

  const emailId: Id<"emails"> = await ctx.db.insert("emails", {
    senderProfileId: params.senderProfileId,
    subject: params.subject,
    body: params.body,
    threadId,
  });

  await ctx.db.insert("mailboxEntries", {
    senderProfileId: params.senderProfileId,
    ownerProfileId: params.senderProfileId,
    emailId,
    folder: "sent",
    isRead: true,
    subject: params.subject,
    threadId,
  });

  for (const recipientId of params.toProfileIds) {
    await ctx.db.insert("mailboxEntries", {
      senderProfileId: params.senderProfileId,
      ownerProfileId: recipientId,
      emailId,
      folder: "inbox",
      isRead: false,
      subject: params.subject,
      threadId,
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
  returns: v.null(),
  async handler(ctx, args): Promise<null> {
    const senderProfile = await ctx.runQuery(
      api.profile.profiles.getCurrent,
      {},
    );

    if (!senderProfile) {
      throw new Error("Sender profile not found");
    }

    // Enforce max recipient email length of 150 on server
    for (const r of args.to) {
      if (r.length > 150) {
        throw new Error("Recipient email exceeds 150 characters");
      }
    }

    await ctx.scheduler.runAfter(
      0,
      internal.email.orchestrator.ensureRecipientsExist,
      {
        senderProfileId: senderProfile._id,
        recipients: args.to,
        subject: args.subject,
        body: args.body,
        threadId: args.threadId,
      },
    );

    return null;
  },
});

export const reply = mutation({
  args: v.object({
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    threadId: v.string(),
  }),
  returns: v.null(),
  async handler(ctx, args): Promise<null> {
    const senderProfile = await ctx.runQuery(
      api.profile.profiles.getCurrent,
      {},
    );

    if (!senderProfile) {
      throw new Error("Sender profile not found");
    }

    const toProfileIds = new Set<Id<"profiles">>();
    for (const recipient of args.to) {
      const recipientProfile = await ctx.runQuery(
        api.profile.profiles.getByEmail,
        { email: recipient },
      );
      if (!recipientProfile) {
        throw new Error("Recipient profile not found");
      }
      toProfileIds.add(recipientProfile._id);
    }

    if (toProfileIds.size === 0) {
      throw new Error("No recipients available for reply");
    }

    const subject = args.subject.startsWith("Re:")
      ? args.subject
      : `Re: ${args.subject}`;

    const emailId = await writeEmailAndEntries(ctx, {
      senderProfileId: senderProfile._id,
      toProfileIds: Array.from(toProfileIds),
      subject,
      body: args.body,
      threadId: args.threadId,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.email.orchestrator.generateAgentReplies,
      { emailId },
    );

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
