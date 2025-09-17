import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    name: v.string(),
    email: v.string(),
  }),
  emailMessage: defineTable({
    from: v.id("user"),
    to: v.array(v.id("user")),
    subject: v.string(),
    body: v.string(),
  }),
});
