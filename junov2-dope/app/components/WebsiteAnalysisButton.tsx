'use client';

import { useState } from "react";
import { analyzeWebsiteAction, createInterviewQuestions } from "../actions";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAgent } from "../providers/AgentProvider";


interface AbilitiesForAgentProps {
  setInterviewQuestions: (questions: any) => void;
}

export const AbilitiesForAgent = ({ setInterviewQuestions }: AbilitiesForAgentProps) => {
  const { currentAgent } = useAgent();

  const [toggleUrlInput, setToggleUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"interview" | "analyze">("analyze");

  // Query for recent transcript entries
  const transcriptEntries = useQuery(
    api.knowledgeBase.getRecentTranscriptEntries,
    currentAgent ? { agentId: currentAgent._id, limit: 5 } : "skip"
  );

  const quickFormatUrl = (url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url;
    }
    return url;
  }

  const handleAnalyzeWebsite = async () => {
    const formattedUrl = quickFormatUrl(url);
    setAnalyzeError(null);
    setIsAnalyzingWebsite(true);
    try {
      const res = await analyzeWebsiteAction(formattedUrl);
      console.log("client response", res);
    } catch (err) {
      setAnalyzeError("Failed to analyze the website. Please try again.");
    } finally {
      setIsAnalyzingWebsite(false);
    }
  }

  const handleInterview = async () => {
    const formattedUrl = quickFormatUrl(url);
    setAnalyzeError(null);
    setIsAnalyzingWebsite(true);
    
    try {
      // Step 1: Analyze the website
      console.log("Analyzing website...");
      const websiteText = await analyzeWebsiteAction(formattedUrl);
      console.log("Website analysis complete, got text:", websiteText.substring(0, 200) + "...");

      // Step 2: Get transcript content from entries
      const transcriptContents = transcriptEntries?.map(entry => entry.content) || [];
      console.log("Found transcript entries:", transcriptContents.length);

      // Step 3: Generate interview questions
      console.log("Generating interview questions...");
      const questions = await createInterviewQuestions(websiteText, transcriptContents);
      console.log("Generated questions:", questions);
      
      setInterviewQuestions(questions);

    } catch (err) {
      console.error("Interview generation error:", err);
      setAnalyzeError("Failed to generate interview questions. Please try again.");
    } finally {
      setIsAnalyzingWebsite(false);
    }
  }

  const handleToolStart = async () => {

    if (selectedMode === "interview") {
      await handleInterview();
    } 

    if (selectedMode === "analyze") {
      await handleAnalyzeWebsite();
    }

    return;

  }

  return (
    <>
      {!toggleUrlInput && (
        <>

          <button
            onClick={() => {
              setSelectedMode("interview");
              setToggleUrlInput(true);
            }}
            className="bg-accent/5 border border-accent  hover:bg-accent-hover hover:text-white cursor-pointer px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3a9 9 0 010 18m0-18a9 9 0 000 18M2.5 9h19M2.5 15h19" />
            </svg>
            Interview
          </button>

          <button
            onClick={() => {
              setSelectedMode("analyze");
              setToggleUrlInput(true);
            }}
            className="bg-accent/5 border border-accent  hover:bg-accent-hover hover:text-white cursor-pointer px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3a9 9 0 010 18m0-18a9 9 0 000 18M2.5 9h19M2.5 15h19" />
            </svg>
            Analyze my website
          </button>

        </>
      )}

      {toggleUrlInput && (
        <div className="w-full">
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`flex-1 px-3 py-2 w-full border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors ${url ? "border-gray-300" : "border-gray-300"
                  }`}
                disabled={isAnalyzingWebsite}
              />
              <button
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                disabled={!url.trim() || isAnalyzingWebsite}
                onClick={async () => await handleToolStart()}
              >
                {isAnalyzingWebsite ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  selectedMode === "interview" ? "Interview" : "Analyze"
                )}
              </button>
              <button
                onClick={() => {
                  setUrl("");
                  setToggleUrlInput(false);
                  setIsAnalyzingWebsite(false);
                  setAnalyzeError(null);
                  setSelectedMode("analyze");
                }}
                className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">We’ll scan your site and extract actionable insights.</p>
            {analyzeError && (
              <p className="text-xs text-red-600 mt-2">{analyzeError}</p>
            )}
          </div>
        </div>
      )}

    </>
  )

}