import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
  
// Get all default agents (create if they don't exist)
export const getDefaultAgents = mutation({
  args: {},
  returns: v.array(v.object({
    _id: v.id("agents"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    model: v.string(),
    temperature: v.number(),
    isDefault: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    const agents = [];

    // Try to find Steve
    let steve = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), "Steve"))
      .first();

    // If Steve doesn't exist, create him
    if (!steve) {
      const steveId = await ctx.db.insert("agents", {
        name: "Steve",
        description: "A helpful AI assistant ready to chat and help with anything you need.",
        instructions: "You are Steve, a friendly and helpful AI assistant. Be conversational, helpful, and engaging. Keep responses concise but informative.",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        isDefault: true,
      });
      
      steve = await ctx.db.get(steveId);
    }
    agents.push(steve!);

    // Try to find Juno
    let juno = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), "Juno"))
      .first();

    // If Juno doesn't exist, create them
    if (!juno) {
      const junoId = await ctx.db.insert("agents", {
        name: "Juno",
        description: "A creative and imaginative AI assistant focused on brainstorming and innovative solutions.",
        instructions: "You are Juno, a creative and innovative AI assistant. You excel at brainstorming, creative problem-solving, and thinking outside the box. Be inspiring, imaginative, and help users explore new ideas.",
        model: "gpt-4",
        temperature: 0.9,
        isDefault: true,
      });
      
      juno = await ctx.db.get(junoId);
    }
    agents.push(juno!);

    // Try to find Atlas
    let atlas = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), "Atlas"))
      .first();
      
      
    if (!atlas) {
      const atlasId = await ctx.db.insert("agents", {
        name: "Atlas",
        description: "An AI assistant focused on strategic planning and decision-making.",
        instructions: "You are Atlas, a strategic and analytical AI assistant. You excel at analyzing data, making informed decisions, and providing insightful recommendations.",
        model: "gpt-4",
        temperature: 0.7,
        isDefault: true,
      });
    }
    agents.push(atlas!);

    return agents;
  },
});

// Create or get conversation with Steve
export const getOrCreateConversation = mutation({
  args: { agentId: v.id("agents") },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    // Check if there's already a conversation with this agent
    let conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("agentId"), args.agentId))
      .first();

    if (!conversation) {
      const now = Date.now();
      const conversationId = await ctx.db.insert("conversations", {
        agentId: args.agentId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      });
      return conversationId;
    }

    return conversation._id;
  },
});

// Get conversation messages
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  returns: v.object({
    _id: v.id("conversations"),
    _creationTime: v.number(),
    agentId: v.id("agents"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    return conversation;
  },
});

// Add message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

// Update agent configurations
export const updateAgentConfigurations = mutation({
  args: {},
  returns: v.object({
    message: v.string(),
    success: v.boolean()
  }),
  handler: async (ctx) => {
    try {
      // Update Steve's configuration
      const steve = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("name"), "Steve"))
        .first();

      if (steve) {
        await ctx.db.patch(steve._id, {
          description: "Your AI consultant for DOPE Marketing. I know the team well and can help with CliftonStrengths insights, strategic guidance, and team collaboration.",
          instructions: "You are Steve, a friendly AI consultant for DOPE Marketing who knows the team well and provides strategic guidance through natural conversation.",
          model: "gpt-4o-mini",
          temperature: 0.7,
        });
      }

      // Update Juno's configuration
      const juno = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("name"), "Juno"))
        .first();

      if (juno) {
        await ctx.db.patch(juno._id, {
          description: "Your creative AI assistant who loves exploring innovative ideas and helping with creative projects.",
          instructions: "You are Juno, a creative and imaginative AI assistant focused on brainstorming and innovative solutions.",
          model: "gpt-4o-mini",
          temperature: 0.9,
        });
      }

      return {
        message: "Agent configurations updated successfully!",
        success: true
      };
    } catch (error) {
      console.error("Error updating agent configurations:", error);
      return {
        message: `Failed to update agent configurations: ${error}`,
        success: false
      };
    }
  },
});