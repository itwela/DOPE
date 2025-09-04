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
  knowledgeBaseEntries: defineTable({
    agentId: v.id("agents"),
    type: v.union(v.literal("file"), v.literal("text"), v.literal("transcript-for-interview")),
    title: v.string(),
    content: v.optional(v.string()), // For text entries
    fileId: v.optional(v.id("_storage")), // For file entries
    fileName: v.optional(v.string()), // Original filename for files
    fileType: v.optional(v.string()), // MIME type for files
    ragEntryId: v.optional(v.string()), // Reference to RAG entry
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_agent", ["agentId"]),
  employeeProfiles: defineTable({
    employeeId: v.string(), // e.g., "E-ORP-0001"
    name: v.string(),
    position: v.optional(v.string()), // Job title/position
    reportsTo: v.optional(v.string()), // Manager/supervisor
    gender: v.optional(v.string()), // Gender identity
    assessmentDate: v.string(), // ISO date string
    all34: v.array(v.string()), // Top 10 strengths
    leadDomain: v.string(), // Primary domain
    themeDomains: v.object({
      Executing: v.array(v.string()),
      Influencing: v.array(v.string()),
      RelationshipBuilding: v.array(v.string()),
      StrategyThinking: v.array(v.string()),
    }),
    howToCoach: v.string(),
    bestCollabWith: v.string(),
    watchouts: v.string(),
    communicationTips: v.string(),
    motivators: v.array(v.string()),
    demotivators: v.array(v.string()),
    evidenceQuotes: v.array(v.object({
      quote: v.string(),
      section: v.string(),
    })),
    sourceDocUrl: v.string(),
    sourceProvenance: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_employee_id", ["employeeId"]),
});
