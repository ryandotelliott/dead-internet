import { query } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Doc } from "@/convex/_generated/dataModel";
import { authComponent } from "@/convex/auth";
import { MailboxEntry, MailboxEntryV, MailboxFolderV } from "./emails";

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
      });
    }
    return out;
  },
});
