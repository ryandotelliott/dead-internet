import { mutation, query } from "@/convex/_generated/server";
import { v, Infer } from "convex/values";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { authComponent } from "@/convex/auth";

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
  async handler(ctx, args): Promise<Array<MailboxEntry>> {
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

const emailV = v.object({
  _id: v.id("emails"),
  _creationTime: v.number(),
  senderProfileId: v.id("profiles"),
  subject: v.string(),
  body: v.string(),
});

export type Email = Infer<typeof emailV>;

export const sendEmail = mutation({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.object({ emailId: v.id("emails") }),
  async handler(ctx, args): Promise<{ emailId: Id<"emails"> }> {
    // TODO: Need to allow sending from functions directly
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const senderProfile: Doc<"profiles"> | null = await ctx.db
      .query("profiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();

    if (!senderProfile) {
      throw new Error("Sender profile not found");
    }

    const emailId: Id<"emails"> = await ctx.db.insert("emails", {
      senderProfileId: senderProfile._id,
      subject: args.subject,
      body: args.body,
      threadId: "",
    });

    // Sender's Sent mailbox entry
    await ctx.db.insert("mailboxEntries", {
      senderProfileId: senderProfile._id,
      ownerProfileId: senderProfile._id,
      emailId,
      role: "to",
      folder: "sent",
      read: true,
      subject: args.subject,
    });

    // Recipient Inbox entries (auto-create profiles for unknown emails)
    for (const recipientEmail of args.to) {
      const existingRecipient: Doc<"profiles"> | null = await ctx.db
        .query("profiles")
        .withIndex("byEmail", (q) => q.eq("email", recipientEmail))
        .unique();

      // TODO: Create profile if it doesn't exist
      if (!existingRecipient) {
        throw new Error("Recipient profile not found");
      }

      await ctx.db.insert("mailboxEntries", {
        senderProfileId: senderProfile._id,
        ownerProfileId: existingRecipient._id,
        emailId,
        role: "to",
        folder: "inbox",
        read: false,
        subject: args.subject,
      });
    }

    return { emailId };
  },
});

export const markMailboxEntryRead = mutation({
  args: { mailboxEntryId: v.id("mailboxEntries"), read: v.boolean() },
  returns: v.null(),
  async handler(ctx, args): Promise<null> {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

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
