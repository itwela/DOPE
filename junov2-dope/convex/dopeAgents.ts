import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import { Agent, saveMessage, listMessages } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { rag } from "./knowledgeBase";
import { action, query, mutation, internalAction } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { atlasDefaultTools, steveDefaultTools } from "./dopeAgentsTools";

const sharedDefaults = {
  // The chat completions model to use for the agent.
  languageModel: openai.chat("gpt-4o-mini"),
  // Embedding model to power vector search of message history (RAG).
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
}

/* REVIEW Juno Agent  ------------------------------

-------------------------------------- */

// Juno Agent - Creative AI Assistant
export const junoAgent = new Agent(components.agent, {
  name: "Juno",
  instructions: `You are Juno, a creative AI assistant who loves exploring innovative ideas and helping with creative projects. You have an enthusiastic and imaginative personality.

Your Role & Capabilities:
- Creative brainstorming and ideation
- Help with artistic and design projects
- Innovative problem-solving approaches
- Encouraging creative thinking and exploration
- Supporting creative workflows and processes

Key Guidelines:
1. Be enthusiastic and encouraging about creative ideas
2. Ask open-ended questions to spark creativity
3. Suggest multiple creative approaches to problems
4. Think outside the box and challenge conventional thinking
5. Be supportive of experimental and bold ideas
6. Help break down creative blocks
7. Connect different concepts in unexpected ways

Communication Style:
- Energetic and positive
- Use creative metaphors and analogies
- Ask "What if?" questions frequently
- Encourage experimentation
- Celebrate unique perspectives`,
  ...sharedDefaults,
  tools: {
    
  }
});

/**
 * Create a new conversation thread with Juno
 */
export const createJunoThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    projectType: v.optional(v.string())
  },
  returns: v.object({
    threadId: v.string(),
    welcomeMessage: v.string()
  }),
  handler: async (ctx, args) => {
    const { thread } = await junoAgent.createThread(ctx, {
      userId: args.userId,
      title: args.title || "Creative Session with Juno",
      summary: `Creative collaboration session${args.projectType ? ` for ${args.projectType}` : ''}`
    });

    // Generate welcome message
    let welcomeMessage = "Hey there! I'm Juno, your creative AI assistant. To help me spark your creativity and provide the best ideas, could you please tell me:\n\n";

    welcomeMessage += "1. What kind of creative project are you working on?\n";
    welcomeMessage += "2. What's your main goal or challenge for this session?\n";
    welcomeMessage += "3. Are there any specific themes, styles, or inspirations you have in mind?\n\n";
    welcomeMessage += "This helps me tailor my creative suggestions specifically to your vision.";

    const metadata = await thread.getMetadata();
    return {
      threadId: metadata._id,
      welcomeMessage
    };
  },
});

/* Atlas Agent - Business Intelligence Specialist
 ------------------------------
-------------------------------------- */

// Atlas Agent - Business Intelligence and Analysis
export const atlasAgent = new Agent(components.agent, {
  name: "Atlas",
  instructions: `You are Atlas, a meticulous business intelligence agent for DOPE Marketing. Your core mission is to gather, analyze, and organize comprehensive business intelligence through three primary capabilities: First, Website Analysis where you scan and analyze websites to extract key business insights, competitive intelligence, market positioning, and strategic opportunities. Focus on content strategy, user experience, technical implementation, and business model analysis. Second, Call Transcript Analysis where you review Fathom call transcripts to identify patterns, extract key insights, track client sentiment, uncover pain points, and highlight actionable opportunities. Synthesize findings into clear, strategic recommendations. Third, Strategic Interviews where you conduct structured interviews to gather business intelligence, validate assumptions, explore market opportunities, and build comprehensive knowledge bases. Ask probing questions that reveal deeper insights. Your approach should be systematic by following methodical processes for thorough analysis, comprehensive by leaving no stone unturned in your investigations, strategic by focusing on insights that drive business decisions, organized by presenting findings in clear actionable formats, and proactive by suggesting next steps and deeper investigation areas. Always provide detailed analysis with specific examples, data points, and strategic recommendations. Structure your responses with clear headings, bullet points, and actionable insights.`,
  tools: {
    ...atlasDefaultTools
  },
  ...sharedDefaults
});

/**
 * Create a new conversation thread with Atlas
 */
export const createAtlasThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    analysisType: v.optional(v.string())
  },
  returns: v.object({
    threadId: v.string(),
    welcomeMessage: v.string()
  }),
  handler: async (ctx, args) => {
    const { thread } = await atlasAgent.createThread(ctx, {
      userId: args.userId,
      title: args.title || "Business Intelligence with Atlas",
      summary: `Business intelligence analysis session${args.analysisType ? ` for ${args.analysisType}` : ''}`
    });

    const welcomeMessage = "Hello! I'm Atlas, your business intelligence specialist at DOPE Marketing. I excel at mapping your business landscape through website analysis, call transcript evaluation, and strategic interviews. I'll help you build comprehensive knowledge bases that provide complete visibility into your market, competitors, and opportunities. What area of your business would you like me to investigate and analyze today?";

    const metadata = await thread.getMetadata();
    return {
      threadId: metadata._id,
      welcomeMessage
    };
  },
});

/* REVIEW Steve Agent 
 ------------------------------
-------------------------------------- */

// Steve Agent with RAG tools and strategic guidance capabilities
export const steveAgent = new Agent(components.agent, {
  name: "Steve",
  instructions: `
  <default_system_instructions>

  You are Steve, a friendly and helpful AI assistant for DOPE Marketing. You chat naturally like a knowledgeable colleague who knows the team well.

    BE A REAL CHATBOT:
    - Have natural conversations, not formal responses
    - Act like you already know people when they're mentioned
    - Be genuinely helpful and interested
    - Ask follow-up questions to keep chatting
    - Never dump raw information - always chat naturally

    WHEN PEOPLE ASK ABOUT EMPLOYEES:
    - Single person: Use searchEmployeeProfiles and respond like you know them personally
    - Multiple people or "my team": Use searchTeamInsights to find patterns and give overview insights
    - Always respond conversationally, never like you're searching
    - Synthesize information into natural conversation
    - Ask engaging follow-up questions

    EXAMPLE STYLE:
    User: "Tell me about Abby"
    You: "Oh Abby! She's fantastic with people - has this amazing ability to get everyone excited about projects. She's really strong in Woo and Communication, so she's great at rallying teams. What are you working on with her?"

    Remember: You're a chatbot who happens to have access to helpful information, not a search engine that talks.

    IMPORTANT: You have access to search tools to look up employee information, but NEVER mention that you're searching or using tools. Just respond naturally like you know the information.

    EXAMPLE CONVERSATIONS:
    User: "Tell me about Sarah"
    You: "Oh Sarah! She's really great - super organized and has this natural ability to see the big picture while managing all the details. What are you working on with her?"

    User: "Tell me about my employees"  
    You: "I'd love to help with that! Are you looking for insights about your whole team, or are there specific people you want to know about? I can share what I know about strengths, working styles, that kind of thing."

    User: "What are our team's strengths?"
    You: "From what I know about your team, you've got a really nice mix! You have some strong Influencers who are great at rallying people, plus some solid Executing folks who get things done. Want me to break down specific patterns I'm seeing or talk about particular people?"

    KEEP IT NATURAL: Chat like a friendly colleague who knows everyone well, not like a formal consultant or search engine.
  
    </default_system_instructions>

  `,
  tools: {
    ...steveDefaultTools
  },
  ...sharedDefaults

});

/**
 * Create a new conversation thread with Steve
 */
export const createSteveThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    userRole: v.optional(v.string()),
    department: v.optional(v.string())
  },
  returns: v.object({
    threadId: v.string(),
    welcomeMessage: v.string()
  }),
  handler: async (ctx, args) => {
    const { thread } = await steveAgent.createThread(ctx, {
      userId: args.userId,
      title: args.title || "Conversation with Steve",
      summary: `Strategic consultation session${args.userRole ? ` for ${args.userRole}` : ''}${args.department ? ` in ${args.department}` : ''}`
    });

    // Generate welcome message
    let welcomeMessage = "Hello! I'm Steve, your AI consultant for DOPE Marketing. ";

    if (args.userRole && args.department) {
      welcomeMessage += `I see you're working as ${args.userRole} in ${args.department}. `;
    }

    welcomeMessage += "How can I help you achieve your goals today?";

    const metadata = await thread.getMetadata();
    return {
      threadId: metadata._id,
      welcomeMessage
    };
  },
});

/**
 * Chat with Steve in an existing thread
 */
export const chatWithSteve = action({
  args: {
    threadId: v.string(),
    message: v.string(),
    userContext: v.optional(v.object({
      role: v.optional(v.string()),
      department: v.optional(v.string()),
      strengths: v.optional(v.array(v.string()))
    }))
  },
  returns: v.object({
    response: v.string(),
    threadId: v.string()
  }),
  handler: async (ctx, args) => {
    const { thread } = await steveAgent.continueThread(ctx, {
      threadId: args.threadId
    });

    // Add user context to the conversation if provided
    let contextualMessage = args.message;
    if (args.userContext) {
      const context = [];
      if (args.userContext.role) context.push(`Role: ${args.userContext.role}`);
      if (args.userContext.department) context.push(`Department: ${args.userContext.department}`);
      if (args.userContext.strengths) context.push(`Strengths: ${args.userContext.strengths.join(', ')}`);

      if (context.length > 0) {
        contextualMessage = `[User Context: ${context.join(' | ')}]\n\n${args.message}`;
      }
    }

    const result = await thread.generateText({
      prompt: contextualMessage
    });

    return {
      response: result.text,
      threadId: args.threadId
    };
  },
});

/**
 * Get conversation history for a thread
 */
export const getSteveConversation = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number()
  })),
  handler: async (ctx, args) => {
    // This would use the agent's message listing functionality
    // For now, return empty array - implement with actual message retrieval
    return [];
  },
});

/**
 * Update user context for better guidance
 */
export const updateUserContext = action({
  args: {
    threadId: v.string(),
    userContext: v.object({
      name: v.optional(v.string()),
      role: v.optional(v.string()),
      department: v.optional(v.string()),
      strengths: v.optional(v.array(v.string())),
      currentProjects: v.optional(v.array(v.string())),
      goals: v.optional(v.array(v.string()))
    })
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string()
  }),
  handler: async (ctx, args) => {
    try {
      const { thread } = await steveAgent.continueThread(ctx, {
        threadId: args.threadId
      });

      // Update thread metadata with user context
      await thread.updateMetadata({
        summary: `Strategic consultation for ${args.userContext.name || 'team member'}${args.userContext.role ? ` (${args.userContext.role})` : ''}${args.userContext.department ? ` in ${args.userContext.department}` : ''}`
      });

      return {
        success: true,
        message: "User context updated successfully. I can now provide more targeted guidance based on your role and department."
      };
    } catch (error) {
      console.error("Error updating user context:", error);
      return {
        success: false,
        message: "Failed to update user context. Please try again."
      };
    }
  },
});


/**
 * Utility function to help populate Steve's knowledge base
 */
export const addToSteveKnowledgeBase = action({
  args: {
    namespace: v.union(
      v.literal("dope-marketing-knowledge"),
      v.literal("role-guidance"),
      v.literal("strategic-planning")
    ),
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.record(v.string(), v.any()))
  },
  returns: v.object({
    success: v.boolean(),
    entryId: v.string()
  }),
  handler: async (ctx, args) => {
    try {
      const result = await rag.add(ctx, {
        namespace: args.namespace,
        text: args.content,
        title: args.title,
        metadata: args.metadata || {},
        importance: 1.0
      });

      return {
        success: true,
        entryId: result.entryId
      };
    } catch (error) {
      console.error("Error adding to Steve's knowledge base:", error);
      throw new Error(`Failed to add content to knowledge base: ${error}`);
    }
  },
});

/* ------------------------------
REVIEW Utility Functions
-------------------------------------- */

/**
 * Send a message to any agent and trigger async response generation
 */
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    userId: v.optional(v.string()),
    agentName: v.optional(v.string())
  },
  returns: v.object({
    messageId: v.string(),
    success: v.boolean()
  }),
  handler: async (ctx, { threadId, prompt, userId, agentName }) => {
    try {
      // Save the user message
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId,
        userId,
        prompt,
      });

      // Schedule async response generation with agent name
      await ctx.scheduler.runAfter(0, internal.dopeAgents.generateResponseAsync, {
        threadId,
        promptMessageId: messageId,
        agentName,
      });

      return {
        messageId,
        success: true
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error(`Failed to send message: ${error}`);
    }
  },
});

/**
 * Generate response asynchronously for any agent
 */
export const generateResponseAsync = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    agentName: v.optional(v.string())
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId, agentName }) => {
    try {
      // Determine which agent to use based on agentName
      let agent;
      switch (agentName) {
        case "Juno":
          agent = junoAgent;
          break;
        case "Atlas":
          agent = atlasAgent;
          break;
        case "Steve":
        default:
          agent = steveAgent;
          break;
      }

      await agent.generateText(ctx, { threadId }, { promptMessageId });
      return null;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  },
});

/**
 * List messages in a thread with pagination
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator
  },
  returns: v.object({
    page: v.array(v.any()), // Message type is complex, using v.any() for now
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    try {
      const paginated = await listMessages(ctx, components.agent, args);
      return paginated;
    } catch (error) {
      console.error("Error listing messages:", error);
      throw new Error(`Failed to list messages: ${error}`);
    }
  },
});

/**
 * Get basic thread info
 */
export const getThreadInfo = query({
  args: {
    threadId: v.string()
  },
  returns: v.union(v.null(), v.object({
    _id: v.string(),
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    _creationTime: v.number(),
    status: v.union(v.literal("active"), v.literal("archived"))
  })),
  handler: async (ctx, { threadId }) => {
    try {
      // For now, return a basic thread object
      // In a real implementation, you'd query the actual thread metadata
      return {
        _id: threadId,
        userId: "user-1",
        title: "Chat Thread",
        summary: "A conversation thread",
        _creationTime: Date.now(),
        status: "active" as const
      };
    } catch (error) {
      console.error("Error getting thread info:", error);
      return null;
    }
  },
});

/**
 * Generate a thread title from the first user message
 */
function generateThreadTitle(firstMessage: string): string {
  // Clean and truncate the message to create a meaningful title
  const cleaned = firstMessage.trim().replace(/\n+/g, ' ');

  // If message is short, use it as-is
  if (cleaned.length <= 40) {
    return cleaned;
  }

  // Truncate and add ellipsis
  return cleaned.substring(0, 40).trim() + '...';
}

/**
 * Get recent threads for a user and agent from the agent component
 */
export const getRecentThreads = query({
  args: {
    userId: v.string(),
    agentName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
  })),
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 10;

      // Use the agent component's listThreadsByUserId function
      const threadsResult = await ctx.runQuery(
        components.agent.threads.listThreadsByUserId,
        {
          userId: args.userId,
          paginationOpts: { cursor: null, numItems: limit }
        }
      );

      // Filter threads by agent if agentName is provided
      let filteredThreads = threadsResult.page;
      if (args.agentName) {
        filteredThreads = threadsResult.page.filter((thread: any) => {
          const title = thread.title || thread.summary || '';
          const summary = thread.summary || '';

          // Filter based on agent-specific patterns in title/summary
          if (args.agentName === 'Steve') {
            return title.includes('Steve') || summary.includes('Strategic') || title.includes('Conversation with Steve');
          } else if (args.agentName === 'Juno') {
            return title.includes('Juno') || summary.includes('Creative') || title.includes('Creative Session');
          } else if (args.agentName === 'Atlas') {
            return title.includes('Atlas') || summary.includes('Business Intelligence') || title.includes('Business Intelligence with Atlas');
          }

          return true; // For other agents, show all threads for now
        });
      }

      // Transform the results to match our expected format
      return filteredThreads.map((thread: any) => ({
        _id: thread._id,
        _creationTime: thread._creationTime,
        userId: thread.userId,
        title: thread.title,
        summary: thread.summary,
        status: (thread.status as "active" | "archived") || "active", // Cast to expected type
      }));
    } catch (error) {
      console.error("Error getting recent threads:", error);
      return [];
    }
  },
});

/**
 * Load an existing thread for conversation
 */
export const loadThread = action({
  args: {
    threadId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    threadId: v.string(),
    welcomeMessage: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // For existing threads, we just return the threadId
      // The UI will load messages using listThreadMessages
      return {
        threadId: args.threadId,
        welcomeMessage: undefined, // No welcome message for existing threads
      };
    } catch (error) {
      console.error("Error loading thread:", error);
      throw new Error("Failed to load thread");
    }
  },
});

/**
 * Delete a thread and all its messages
 */
export const deleteThread = action({
  args: {
    threadId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Use the agent component's deleteThreadAsync function
      // This will delete the thread and all associated messages
      await steveAgent.deleteThreadAsync(ctx, {
        threadId: args.threadId
      });

      return {
        success: true,
        message: "Thread deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting thread:", error);
      return {
        success: false,
        message: "Failed to delete thread"
      };
    }
  },
});
