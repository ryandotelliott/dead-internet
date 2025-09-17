import { query } from "../_generated/server";
import { v, Infer } from "convex/values";

// — Validators —
export const InboxItemV = v.object({
  _id: v.id("emailMessages"),
  _creationTime: v.number(),
  subject: v.string(),
  senderName: v.string(),
  body: v.string(),
});

export const EmailMessageV = v.object({
  _id: v.id("emailMessages"),
  _creationTime: v.number(),
  subject: v.string(),
  body: v.string(),
  fromName: v.string(),
});

export type InboxItem = Infer<typeof InboxItemV>;
export type EmailMessage = Infer<typeof EmailMessageV>;

export const listInbox = query({
  args: {},
  returns: v.array(InboxItemV),
  async handler(ctx) {
    const messages = await ctx.db.query("emailMessages").order("desc").take(50);
    const out: InboxItem[] = [];
    for (const m of messages) {
      const fromUser = await ctx.db.get(m.from);
      out.push({
        _id: m._id,
        _creationTime: m._creationTime,
        subject: m.subject,
        senderName: fromUser?.name ?? "Unknown",
        body: m.body,
      });
    }
    return out;
  },
});
