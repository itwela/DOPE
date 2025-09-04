'use server';

import Firecrawl from '@mendable/firecrawl-js';
import { z } from 'zod';
const firecrawl = new Firecrawl({ apiKey: process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY : process.env.FIRECRAWL_API_KEY});
import { CrawlStatusResponse } from '@mendable/firecrawl-js';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export const analyzeWebsiteAction = async (url: string) => {

    try {

    const docs = await firecrawl.crawlUrl(url, { 
        limit: 30, 
        scrapeOptions: {
            onlyMainContent: true,
            formats: ['markdown']
        } ,
    }) as CrawlStatusResponse;

    const theMarkdown = docs?.data?.map(doc => doc.markdown).join("\n");

    console.log(theMarkdown);

    return theMarkdown || "";
    } catch (error) {
        console.error("Error analyzing website:", error);
        throw new Error(`Failed to analyze website: ${error}`);
    }


}








/* 

Gemini Utilities

*/

const geminiAi = new GoogleGenAI({ apiKey: process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : process.env.GEMINI_API_KEY });

export const formatTranscriptForKb_Gemini = async (transcript: string) => {
    try {
        const response = await geminiAi.models.generateContent({
            // model: "gemini-2.0-flash",
            model: "gemini-2.5-flash",
            contents: `This Data Is Going Into A Knowledge Base. Please fill out the entire schema. Here is the transcript you need ot use to do so. {transcript: ${transcript}}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: z.object({
                    when: z.string().describe("ISO 8601 timestamp for when the conversation occurred (UTC preferred), if thats too much, just put the date you see. We are in 2025."),
                    industry: z.string().describe("Industry of the company"),
                    speakers: z
                        .array(z.string().describe("normalized speaker name"))
                        .describe("List of speakers present in the transcript"),
                    topics: z
                        .array(z.string().describe("Concise topic label (e.g., 'pricing', 'onboarding')"))
                        .describe("High-signal topics discussed (aim for 3–10)"),
                    summary: z
                        .string()
                        .describe("2–5 sentence executive summary of the conversation"),
                    keypoints: z
                        .array(z.string().describe("Single key takeaway bullet"))
                        .describe("5–10 key points capturing the most important takeaways"),
                    actionItems: z
                        .array(z.string().describe("Action item phrased as a single, clear sentence"))
                        .describe("Concrete next steps extracted from the transcript"),
                    sections: z
                        .array(
                            z
                                .object({
                                    name: z.string().describe("Section label or phase (e.g., 'pre-context', 'discussion', 'wrap-up')"),
                                    summary: z.string().describe("1–2 sentence summary of this section"),
                                })
                                .describe("A single ordered section of the transcript")
                        )
                        .describe("Ordered sections outlining the flow of the conversation"),
                    
                }).describe("You must return an obect with these keys minimum which are, when, speakers, topics, summary, keypoints, actionItems, sections"),
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error formatting transcript for KB:", error);
        throw new Error(`Failed to format transcript for KB: ${error}`);
    }
}

/* 

Open Ai Utilities

*/

const openai = new OpenAI({apiKey: process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_OPENAI_API_KEY : process.env.OPENAI_API_KEY});

export const createInterviewQuestions = async (websiteText: string, transcriptContents: string[]) => {
    const combinedTranscripts = transcriptContents.join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          { 
            role: "system", 
            content: `You're helping create casual, conversational interview questions for a business owner. 
            
            Your goal is to create friendly questions that will help you understand:
            - How the business makes money and what they sell
            - What challenges they're facing and what's going well
            - Who their customers are and what they're like
            - How things work day-to-day and what's frustrating
            - Where they want to take the business
            - What the team is like and how they work together
            - How the finances are doing
            
            Make the questions feel like a natural conversation - friendly, curious, and easy to answer / more on the casual side.
            Think of it like you're genuinely interested in learning about their business over coffee.
            
            Respond with a JSON object containing a "questions" array. Each question should have "question", "category", and "reasoning" fields.` 
          },
          {
            role: "user",
            content: `Based on the website analysis and previous conversation transcripts below, create 20-25 casual, friendly interview questions to ask the business owner.

WEBSITE ANALYSIS:
${websiteText}

PREVIOUS CONVERSATION TRANSCRIPTS:
${combinedTranscripts}

Generate questions that feel natural and conversational:
1. Ask about things that seem interesting but aren't clear yet
2. Show genuine curiosity about how their business works
3. Ask about both wins and challenges in a supportive way
4. Keep it friendly - like you're genuinely excited to learn about their business
5. Make questions easy to answer without feeling interrogated

Think of it as a casual chat where you want to really understand their world.`,
          },
        ],
        response_format: { type: "json_object" },
      });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    
    return JSON.parse(content);
}

// export const getTranscriptEntriesAction = async (agentId: string) => {
//     // This would need to be called from a client component that has access to Convex
//     // We'll implement this in the WebsiteAnalysisButton component instead
//     throw new Error("This function should not be called directly from server actions");
// }
