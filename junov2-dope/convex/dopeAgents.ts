import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import { Agent, createTool, saveMessage, listMessages } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { rag } from "./knowledgeBase";
import { action, query, mutation, internalAction } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { z } from "zod";

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

  ...sharedDefaults
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

    

    searchCompanyKnowledge: createTool({
      description: "Search DOPE Marketing's internal knowledge base for company information, policies, processes, team structure, and strategic insights AND THEN USE THE SEARCH RESULTS TO ANSWER THE USER'S QUESTION ALWAYS LIKE A HUMAN",
      args: z.object({
        query: z.string().describe("Describe what you're looking for in the company knowledge base")
      }),
      handler: async (ctx, { query }) => {
        try {
          const { text } = await rag.generateText(ctx, {
            search: {
              namespace: "dope-marketing-knowledge",
              query: query,
              limit: 5,
              vectorScoreThreshold: 0.5
            },
            prompt: `You are Steve, a friendly AI assistant for DOPE Marketing. Answer the user's question about the company in a natural, conversational way like you're talking to a colleague. Be warm and helpful, not formal.

            User question: ${query}

            Answer naturally and conversationally:`,
            model: openai.chat("gpt-4o-mini"),
          });

          return text;
        } catch (error) {
          console.error("Error searching company knowledge:", error);
          return "Sorry, I couldn't find information about that right now.";
        }
      },
    }),

    searchEmployeeProfiles: createTool({
      description: "Quietly look up employee profiles, CliftonStrengths, and team member information to enhance your friendly conversation. Use this when someone mentions a person's name, but always respond naturally as if you just know this information about them. Weave the insights seamlessly into warm, conversational responses. USE THE RESULTS TO ANSWER THE USER'S QUESTION ALWAYS LIKE A HUMAN",
      args: z.object({
        personName: z.string().describe("The name of the person to search for (e.g., 'Abby', 'John Smith')"),
        searchType: z.optional(z.string()).describe("Optional: specify what to look for - 'strengths', 'coaching', 'communication', 'collaboration', etc.")
      }),
      handler: async (ctx, { personName, searchType }) => {
        try {
          let query = `Employee Profile: ${personName}`;
          if (searchType) {
            query += ` ${searchType}`;
          }

          const { text } = await rag.generateText(ctx, {
            search: {
              namespace: "role-guidance",
              query: query,
              limit: 3,
              vectorScoreThreshold: 0.3
            },
            prompt: `You are Steve, a friendly colleague who knows ${personName} well. The user is asking about ${personName}. Based on what you know about their CliftonStrengths and profile, respond in a warm, conversational way like you personally know them. 

Focus on their key strengths and what they're great at. Be natural and engaging.

User is asking about: ${personName}${searchType ? ` (specifically about ${searchType})` : ''}

Respond like a friendly colleague:`,
            model: openai.chat("gpt-4o-mini"),
          });

          return text;
        } catch (error) {
          console.error("Error searching employee profiles:", error);
          // Try fallback search with just the name
          try {
            const { text } = await rag.generateText(ctx, {
              search: {
                namespace: "role-guidance",
                query: personName,
                limit: 3,
                vectorScoreThreshold: 0.2
              },
              prompt: `You are Steve, a friendly colleague. The user is asking about ${personName}. Based on any information you can find, respond naturally and warmly. If you don't have much info, be honest but helpful.

Respond like a friendly colleague:`,
              model: openai.chat("gpt-4o-mini"),
            });

            return text;
          } catch (fallbackError) {
            return `I don't have much information about ${personName} in our system yet. Are they a new team member?`;
          }
        }
      },
    }),

    searchTeamInsights: createTool({
      description: "Search for team patterns, strengths distribution, and organizational insights when users ask about multiple employees, their team, or want overviews. Use this for questions like 'tell me about my employees', 'what are our team strengths', etc. USE THE RESULTS TO ANSWER THE USER'S QUESTION ALWAYS LIKE A HUMAN",
      args: z.object({
        query: z.string().describe("What the user wants to know about the team (e.g., 'team strengths overview', 'leadership styles', 'communication patterns')"),
        focus: z.optional(z.string()).describe("Optional: specific focus area like 'strengths', 'domains', 'coaching', 'leadership'")
      }),
      handler: async (ctx, { query, focus }) => {
        try {
          const searchTerms = [
            "Employee Profile",
            "CliftonStrengths",
            "Lead Domain",
            focus || "strengths"
          ];

          const { text } = await rag.generateText(ctx, {
            search: {
              namespace: "role-guidance",
              query: searchTerms.join(" "),
              limit: 10,
              vectorScoreThreshold: 0.2
            },
            prompt: `You are Steve, a friendly AI assistant who knows the DOPE Marketing team well. The user is asking about team insights: "${query}"

Based on the employee profiles and CliftonStrengths data you have access to, provide a warm, conversational overview of the team. Look for patterns in strengths, domains, and working styles. 

Be natural and engaging - like you're talking to a colleague about the team you both work with.

Focus area: ${focus || 'general team strengths'}

Respond conversationally about the team:`,
            model: openai.chat("gpt-4o-mini"),
          });

          return text;
        } catch (error) {
          console.error("Error searching team insights:", error);
          return "I don't have enough team information loaded yet to give you good insights. Want to ask about specific people instead?";
        }
      },
    }),

        searchRoleGuidance: createTool({
      description: "Search for role-specific guidance, job descriptions, responsibilities, and team-specific best practices. USE THE RESULTS TO ANSWER THE USER'S QUESTION ALWAYS LIKE A HUMAN",
      args: z.object({
        role: z.string().describe("The role or department to search guidance for"),
        topic: z.string().describe("Specific topic or challenge within that role")
      }),
      handler: async (ctx, { role, topic }) => {
        try {
          const { text } = await rag.generateText(ctx, {
            search: {
              namespace: "role-guidance",
              query: `${role} ${topic}`,
              limit: 3,
              vectorScoreThreshold: 0.5
            },
            prompt: `You are Steve, a friendly AI assistant for DOPE Marketing. The user is asking about guidance for the ${role} role regarding ${topic}.

Based on any role-specific information you have, provide helpful, conversational advice. Be warm and supportive.

User question: Guidance for ${role} about ${topic}

Respond naturally and helpfully:`,
            model: openai.chat("gpt-4o-mini"),
          });
          
          return text;
        } catch (error) {
          console.error("Error searching role guidance:", error);
          return `I don't have specific guidance for ${role} about ${topic} right now, but I'm happy to help think through general strategies if you'd like!`;
        }
      },
    }),

    getMyConfiguration: createTool({
      description: "Get information about your own configuration, capabilities, and purpose. Use this when users ask about who you are, what you can do, or your role.",
      args: z.object({
        query: z.string().describe("What the user wants to know about you (e.g., 'who are you', 'what can you do', 'what's your purpose')")
      }),
      handler: async (ctx, { query }) => {
        const config = {
          name: "Steve",
          role: "Friendly AI Chatbot & Strategic Consultant for DOPE Marketing",
          purpose: "Help team members succeed through natural conversation and strategic guidance",
          capabilities: [
            "Search employee profiles and CliftonStrengths information",
            "Provide team insights and patterns analysis", 
            "Access company knowledge and strategic information",
            "Give role-specific guidance and coaching advice",
            "Conversational support for team development"
          ],
          personality: "Warm, friendly, conversational - like talking to a helpful colleague who knows the team well",
          model: "gpt-4o-mini",
          specialties: [
            "Employee CliftonStrengths analysis",
            "Team dynamics and collaboration insights", 
            "Strategic guidance for DOPE Marketing team",
            "Natural, conversational assistance"
          ]
        };

        // Return a natural response based on what they're asking
        if (query.toLowerCase().includes("what are you")) {
          return `I'm Steve, your friendly AI assistant here at DOPE Marketing! I'm designed to be like a helpful colleague who knows the team really well. I can help you understand team members' CliftonStrengths, find insights about working with different people, and provide strategic guidance. I have access to employee profiles and company knowledge, but I always chat naturally rather than just dumping information. What would you like to know?`;
        } else if (query.toLowerCase().includes("what can you do") || query.toLowerCase().includes("capabilities")) {
          return `I can help you with quite a few things! I know everyone's CliftonStrengths and can give insights about how to work with different team members, coach them, or collaborate effectively. I can also search our company knowledge base for strategic information and provide role-specific guidance. The cool thing is I chat naturally about all this stuff - I won't just dump data on you. Want to try asking me about someone on the team?`;
        } else {
          return `I'm Steve, your AI assistant for DOPE Marketing! I'm here to help with team insights, CliftonStrengths, and strategic guidance. I know the team well and can chat naturally about how to work with different people or tackle challenges. What specific help are you looking for?`;
        }
      },
    }),
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
