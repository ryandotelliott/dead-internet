import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }),
  emailMessages: defineTable({
    from: v.id("users"),
    to: v.array(v.id("users")),
    subject: v.string(),
    body: v.string(),
  }),
});
