import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    personaSummary: v.optional(v.string()),
    personaCategory: v.optional(v.string()),
  })
    .index("byUser", ["userId"])
    .index("byEmail", ["email"])
    .index("byPersonaCategory", ["personaCategory"]),

  emails: defineTable({
    senderProfileId: v.id("profiles"),
    subject: v.string(),
    body: v.string(),
    threadId: v.string(),
  })
    .index("bySender", ["senderProfileId"])
    .index("byThread", ["threadId"]),

  /*
   * This is a fan-out table, so we can query all emails for a profile quickly
   */
  mailboxEntries: defineTable({
    senderProfileId: v.id("profiles"),
    ownerProfileId: v.id("profiles"), // whose mailbox this appears in
    emailId: v.id("emails"),
    folder: v.union(v.literal("inbox"), v.literal("sent"), v.literal("trash")),
    isRead: v.boolean(),
    subject: v.string(),
    threadId: v.string(),
  })
    .index("byOwner", ["ownerProfileId"])
    .index("byOwnerFolder", ["ownerProfileId", "folder"])
    .index("byEmail", ["emailId"]),

  // Mapping between user-visible email threads and per-agent conversation threads
  agentThreads: defineTable({
    emailThreadId: v.string(),
    agentProfileId: v.id("profiles"),
    agentThreadId: v.string(),
  })
    .index("byEmailThreadAndAgent", ["emailThreadId", "agentProfileId"])
    .index("byEmailThread", ["emailThreadId"])
    .index("byAgentThreadId", ["agentThreadId"]),
});
