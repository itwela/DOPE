import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    model: v.string(),
    temperature: v.number(),
    isDefault: v.optional(v.boolean()),
  }),
  conversations: defineTable({
    agentId: v.id("agents"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
