import { mutation, query } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Doc } from "@/convex/_generated/dataModel";
import { MailboxEntry, MailboxEntryV, MailboxFolderV } from "./emails";
import { api } from "../_generated/api";

export const listEntries = query({
  args: { folder: MailboxFolderV },
  returns: v.array(MailboxEntryV),
  async handler(ctx, args) {
    const profile = await ctx.runQuery(api.profile.profiles.getCurrent, {});

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
    const seenThreads = new Set<string>();
    for (const entry of entries) {
      if (seenThreads.has(entry.threadId)) {
        continue;
      }
      seenThreads.add(entry.threadId);

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

      // Compute recipients by collecting all owners of this email across mailbox entries,
      // excluding the sender's own "sent" entry
      const relatedEntries: Array<Doc<"mailboxEntries">> = await ctx.db
        .query("mailboxEntries")
        .withIndex("byEmail", (q) => q.eq("emailId", entry.emailId))
        .collect();

      const recipientProfileIds = Array.from(
        new Set(
          relatedEntries
            .map((e) => e.ownerProfileId)
            .filter((pid) => pid !== entry.senderProfileId),
        ),
      );

      const recipientDocs: Array<Doc<"profiles">> = [];
      for (const pid of recipientProfileIds) {
        const profileDoc = await ctx.db.get(pid);
        if (profileDoc) recipientDocs.push(profileDoc);
      }

      const recipients = recipientDocs.map((p) => ({
        name: p.name,
        email: p.email,
      }));

      out.push({
        ...entry,
        senderName: senderProfile.name,
        senderEmail: senderProfile.email,
        body: email.body,
        recipients,
        threadId: email.threadId,
      });
    }
    return out;
  },
});

export const markEntryRead = mutation({
  args: { mailboxEntryId: v.id("mailboxEntries"), isRead: v.boolean() },
  returns: v.null(),
  async handler(ctx, args): Promise<null> {
    const profile = await ctx.runQuery(api.profile.profiles.getCurrent);

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const entry = await ctx.db.get(args.mailboxEntryId);
    if (!entry) {
      throw new Error("Mailbox entry not found");
    }
    if (entry.ownerProfileId !== profile._id) {
      throw new Error("Cannot modify an entry you don't own");
    }

    await ctx.db.patch(args.mailboxEntryId, { isRead: args.isRead });
    return null;
  },
});

export const deleteEntry = mutation({
  args: { mailboxEntryId: v.id("mailboxEntries") },
  returns: v.null(),
  async handler(ctx, args) {
    const profile = await ctx.runQuery(api.profile.profiles.getCurrent, {});
    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const entry = await ctx.db.get(args.mailboxEntryId);
    if (!entry) {
      throw new Error("Mailbox entry not found");
    }
    if (entry.ownerProfileId !== profile._id) {
      throw new Error("Cannot delete an entry you don't own");
    }

    await ctx.db.delete(args.mailboxEntryId);
    return null;
  },
});
