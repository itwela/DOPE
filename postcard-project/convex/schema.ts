import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Postcards table
  postcards: defineTable({
    // Basic info
    title: v.string(),
    prompt: v.string(), // Original user prompt
    
    // Content
    headline: v.optional(v.string()),
    bodyText: v.optional(v.string()),
    callToAction: v.optional(v.string()),
    backSideContent: v.optional(v.string()),
    
    // Image data
    imageUrl: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    
    // Metadata
    contentType: v.optional(v.string()), // promotional, tourism, event, etc.
    theme: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    
    // Use cases (optional arrays)
    useCases: v.optional(v.array(v.string())),
    targetAudiences: v.optional(v.array(v.string())),
    distributionChannels: v.optional(v.array(v.string())),
    
    // User and status
    userId: v.optional(v.string()),
    status: v.optional(v.string()), // draft, completed, published
    
    // Engagement
    views: v.optional(v.number()),
    downloads: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_content_type", ["contentType"])
    .index("by_created_at", ["createdAt"]),

  // Users table (basic user management)
  users: defineTable({
    userId: v.string(), // Auth provider user ID
    email: v.string(),
    name: v.optional(v.string()),
    
    // Usage tracking
    generationsUsed: v.optional(v.number()),
    generationsLimit: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.string(),
    lastLoginAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),
}); 