import { query } from "../_generated/server";
import { v, Infer } from "convex/values";
import { api } from "../_generated/api";
import { Doc } from "../_generated/dataModel";

// — Validators —
export const emailV = v.object({
  _id: v.id("emails"),
  _creationTime: v.number(),
  senderProfileId: v.id("profiles"),
  subject: v.string(),
  body: v.string(),
});

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
  messageId: v.id("emails"),
  role: v.union(v.literal("to"), v.literal("cc")),
  folder: MailboxFolderV,
  read: v.boolean(),
  subject: v.string(),

  // Derived fields
  senderName: v.string(),
  senderEmail: v.string(),
});

export type Email = Infer<typeof emailV>;
export type MailboxEntry = Infer<typeof MailboxEntryV>;

export const listMailboxEntries = query({
  args: { folder: MailboxFolderV },
  returns: v.array(MailboxEntryV),
  async handler(ctx, args): Promise<Array<MailboxEntry>> {
    const user: { _id: string } | null = await ctx.runQuery(
      api.auth.getCurrentUser,
      {},
    );
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile: Doc<"profiles"> | null = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
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
      const senderProfile: Doc<"profiles"> | null = await ctx.db
        .query("profiles")
        .withIndex("byUserId", (q) => q.eq("userId", entry.senderProfileId))
        .unique();
      if (!senderProfile) {
        throw new Error("Sender profile not found");
      }
      out.push({
        ...entry,
        senderName: senderProfile.name,
        senderEmail: senderProfile.email,
      });
    }
    return out;
  },
});
