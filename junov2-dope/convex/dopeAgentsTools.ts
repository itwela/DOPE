"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { rag } from "./knowledgeBase";


export const searchCompanyKnowledge = createTool({
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
});

export const searchEmployeeProfiles = createTool({
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
});

export const searchTeamInsights = createTool({
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
});

export const searchRoleGuidance = createTool({
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
});

export const getMyConfiguration = createTool({
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
});


export const steveDefaultTools = {
    searchCompanyKnowledge,
    searchEmployeeProfiles,
    searchTeamInsights,
    searchRoleGuidance,
    getMyConfiguration
};

export const atlasDefaultTools = {
}