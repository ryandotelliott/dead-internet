import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
  })
    .index("byUserId", ["userId"])
    .index("byEmail", ["email"]),

  emails: defineTable({
    fromProfileId: v.id("profiles"),
    subject: v.string(),
    body: v.string(),
    threadId: v.optional(v.id("emailThreads")),
  }).index("byFrom", ["fromProfileId"]),

  /*
   * This is a fan-out table, so we can query all emails for a profile quickly
   */
  mailboxEntries: defineTable({
    fromProfileId: v.id("profiles"),
    ownerProfileId: v.id("profiles"), // whose mailbox this appears in
    messageId: v.id("emailMessages"),
    role: v.union(v.literal("to"), v.literal("cc")),
    folder: v.union(v.literal("inbox"), v.literal("sent"), v.literal("trash")),
    read: v.boolean(),
    subject: v.string(),
  })
    .index("byOwner", ["ownerProfileId"])
    .index("byOwnerFolder", ["ownerProfileId", "folder"])
    .index("byMessage", ["messageId"]),
});
