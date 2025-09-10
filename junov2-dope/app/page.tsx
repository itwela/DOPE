"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { useAgent, Agent } from "./providers/AgentProvider";
import { useToast } from "./providers/ToastProvider";
import EditAgentModal from "./components/EditAgentModal";
import KnowledgeBaseModal from "./components/KnowledgeBaseModal";
import EmployeeProfilesModal from "./components/EmployeeProfilesModal";
import ExpandedTabs from "./components/ExpandedTabs";
import ReactMarkdown from 'react-markdown';
import { CreateNewAgentButton } from "./components/CreateNewAgentButton";
import { AgentCard } from "./components/AgentCard";
import { AbilitiesForAgent } from "./components/WebsiteAnalysisButton";
import { InterviewQuestions, InterviewQuestion } from "./components/componetInterfaces";


export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  
  // Check authentication status (boolean | undefined)
  const isAuthed = useQuery(api.auth.isAuthenticated, {});

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (isAuthed === undefined) return;
    if (isAuthed === false) {
      router.push("/signin");
    }
  }, [isAuthed, router]);

  const {
    agents,
    currentAgent,
    messages,
    welcomeMessage,
    inputMessage,
    setInputMessage,
    isLoading,
    handleSendMessage,
    isEditModalOpen,
    setIsEditModalOpen,
    editingAgent,
    handleEditAgent,
    handleSaveAgent,
    loadExistingThread,
    deleteExistingThread,
    threadId,
    startNewThread,
    handleAgentSelect,
  } = useAgent();

  const { showToast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Knowledge Base Modal state
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false);
  const [knowledgeBaseAgent, setKnowledgeBaseAgent] = useState<Agent | null>(null);

  // Employee Profiles Modal state
  const [isEmployeeProfilesModalOpen, setIsEmployeeProfilesModalOpen] = useState(false);

  // Interview Questions state
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestions | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<{[key: number]: string}>({});

  // Thread management state
  const [expandedThreadsAgent, setExpandedThreadsAgent] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<{ id: string, title: string } | null>(null);

  // Query for recent threads for the current agent
  const recentThreads = useQuery(
    api.dopeAgents.getRecentThreads,
    currentAgent ? {
      userId: "user-1", // Placeholder - in real app, get from auth
      agentName: currentAgent.name,
      limit: expandedThreadsAgent === currentAgent._id ? 20 : 5
    } : "skip"
  );

  // Query for thread counts for all agents (for the badges)
  const allThreadCounts = useQuery(
    api.dopeAgents.getRecentThreads,
    {
      userId: "user-1", // Placeholder - in real app, get from auth
      limit: 100 // Get many threads to count them
    }
  );

  const handleOpenKnowledgeBase = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setKnowledgeBaseAgent(agent);
    setIsKnowledgeBaseModalOpen(true);
  };

  const handleSelectThread = (agent: Agent, selectedThreadId: string) => {
    console.log("Selected thread:", selectedThreadId, "for agent:", agent.name);
    loadExistingThread(agent, selectedThreadId);
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent, threadTitle?: string) => {
    e.stopPropagation(); // Prevent thread selection when clicking delete
    setThreadToDelete({
      id: threadId,
      title: threadTitle || "Untitled conversation"
    });
    setDeleteModalOpen(true);
  };

  const confirmDeleteThread = async () => {
    if (threadToDelete) {
      await deleteExistingThread(threadToDelete.id);
      setDeleteModalOpen(false);
      setThreadToDelete(null);
    }
  };

  const cancelDeleteThread = () => {
    setDeleteModalOpen(false);
    setThreadToDelete(null);
  };

  const handleToggleThreadsExpanded = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent agent selection
    setExpandedThreadsAgent(expandedThreadsAgent === agentId ? null : agentId);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast("Message copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Failed to copy message", "error");
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setInterviewAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // Function to get thread count for a specific agent
  const getThreadCountForAgent = (agentName: string): number => {
    if (!allThreadCounts) return 0;

    return allThreadCounts.filter(thread => {
      const title = thread.title || thread.summary || '';
      const summary = thread.summary || '';

      // Filter based on agent-specific patterns in title/summary
      if (agentName === 'Steve') {
        return title.includes('Steve') || summary.includes('Strategic') || title.includes('Conversation with Steve');
      } else if (agentName === 'Juno') {
        return title.includes('Juno') || summary.includes('Creative') || title.includes('Creative Session');
      }

      return false; // For other agents, return 0 for now
    }).length;
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show loading state while checking authentication or loading current agent
  if (isAuthed === undefined || !currentAgent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will handle this)
  if (isAuthed === false) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        {/* Agent Selector Sidebar */} 
        <div className="w-[30vw] h-screen bg-white flex flex-col">
          <div className="p-6">
            <h2 className="text-sm font-bold text-[#EB1416]">Your Agents</h2>
            <p className="text-xs text-gray-600 mt-1">Select an agent to chat with</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Agent Cards */}
            {agents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                currentAgent={currentAgent}
                onSelect={handleAgentSelect}
                onEdit={handleEditAgent}
                onOpenKnowledgeBase={handleOpenKnowledgeBase}
                recentThreads={currentAgent?._id === agent._id ? (recentThreads || []) : []}
                onSelectThread={handleSelectThread}
                onDeleteThread={handleDeleteThread}
                onToggleExpanded={handleToggleThreadsExpanded}
                currentThreadId={threadId}
                isExpanded={expandedThreadsAgent === agent._id}
                threadCount={getThreadCountForAgent(agent.name)}
                startNewThread={startNewThread}
                isLoadingThreads={!recentThreads && currentAgent?._id === agent._id}
              />
            ))}

            {/* Create New Agent Button - Currently Is Comming Soon Button */}
            <CreateNewAgentButton/>
          </div>

          <div className="p-4 w-full">
            <ExpandedTabs onEmployeeProfilesClick={() => setIsEmployeeProfilesModalOpen(true)} />
          </div>
        </div>

        <div className="w-full h-screen relative overflow-y-scroll">

          {/* Header */}
          <header className="fixed w-full z-50 px-6 py-4 ">
            {/* <header className="fixed w-full z-50 px-6 py-4 backdrop-blur-md "> */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-sm font-bold text-[#EB1416]">DOPE Agent Playground</h1>
                <p className="text-gray-600 text-xs">Chatting with {currentAgent.name}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-accent hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </header>

          <div className="h-[100px]"></div>

          <div className="min-h-screen overflow-hidden w-full bg-gray-50 flex flex-col">


            {/* Chat Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col pb-[10%]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                {messages.length === 0 && welcomeMessage ? (
                  <div className="flex justify-start  flex-col gap-2">
                    <div className="bg-white border border-gray-200 text-gray-900 max-w-md px-4 py-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">{currentAgent.name}</div>
                      <div className="whitespace-pre-wrap">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              a: ({ ...props }) => (
                                <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                              ),
                              ul: ({ ...props }) => (
                                <ul {...props} className="list-disc list-inside space-y-1 my-2" />
                              ),
                              ol: ({ ...props }) => (
                                <ol {...props} className="list-decimal list-inside space-y-1 my-2" />
                              ),
                              p: ({ ...props }) => (
                                <p {...props} className="my-2" />
                              ),
                              strong: ({ ...props }) => (
                                <strong {...props} className="font-semibold text-gray-900" />
                              ),
                            }}
                          >
                            {welcomeMessage}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    {/* only show in atlas the website analysis button */}
                    {currentAgent.name === "Atlas" && (
                      <>
                        <div className="flex mb-4 max-w-md items-center justify-start gap-2">

                          {/* tool emoji */}
                          {/* <span>Tools 🛠️: </span> */}
                          <AbilitiesForAgent setInterviewQuestions={setInterviewQuestions} />
                        </div>

                        {/* put the interview questions here */}
                        {interviewQuestions && (
                          <div className="mt-4 w-full">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Questions
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Based on your website and previous conversations, here are strategic questions to help understand your business better:
                              </p>
                              <div className="space-y-4">
                                {interviewQuestions.questions?.map((q: InterviewQuestion, index: number) => (
                                  <div key={index} className="border-l-4 border-accent pl-4">
                                    <div className="flex items-start gap-2">
                                      <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                                        {index + 1}
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {q.category}
                                          </span>
                                          <span className="text-xs text-gray-500">{q.reasoning}</span>
                                        </div>
                                        <textarea
                                          value={interviewAnswers[index] || ""}
                                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                                          placeholder="Type your answer here..."
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const questionsAndAnswers = interviewQuestions.questions
                                        ?.map((q: InterviewQuestion, i: number) => {
                                          const answer = interviewAnswers[i];
                                          return `${i + 1}. ${q.question}\n${answer ? `Answer: ${answer}` : 'Answer: [Not answered yet]'}\n`;
                                        })
                                        .join('\n');
                                      navigator.clipboard.writeText(questionsAndAnswers);
                                      showToast("Questions and answers copied to clipboard!", "success");
                                    }}
                                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                  >
                                    📋 Copy Q&A
                                  </button>
                                  <button
                                    onClick={() => setInterviewQuestions(null)}
                                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                  >
                                    ✕ Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {messages.map((message, index) => {
                  // Check if this is a tool call message (only for assistant messages that start with "Tool:")
                  const isToolCall = message.role === 'assistant' && message.content.startsWith('Tool:');

                  return (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-lg relative group ${message.role === "user"
                            ? "bg-accent text-white"
                            : isToolCall
                              ? "bg-blue-50 border border-blue-200 text-blue-800"
                              // : isSystemMessage
                              //   ? "bg-gray-50 border border-gray-200 text-gray-600"
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}
                      >
                        {/* Copy button - show for all non-user messages */}
                        {message.role !== "user" && (
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-200"
                            title="Copy message"
                          >
                            <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                          {message.role === "user" ? (
                            "You"
                          ) : isToolCall ? (
                            <>
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {currentAgent.name}
                            </>
                          ) : (
                            currentAgent.name
                          )}
                        </div>
                        <div className={message.role !== "user" ? "pr-6" : ""}>
                          {message.role === "assistant" && !isToolCall ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  // Customize link styling
                                  a: ({ ...props }) => (
                                    <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                                  ),
                                  // Customize list styling
                                  ul: ({ ...props }) => (
                                    <ul {...props} className="list-disc list-inside space-y-1 my-2" />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol {...props} className="list-decimal list-inside space-y-1 my-2" />
                                  ),
                                  // Customize paragraph spacing
                                  p: ({ ...props }) => (
                                    <p {...props} className="my-2" />
                                  ),
                                  // Customize strong/bold text
                                  strong: ({ ...props }) => (
                                    <strong {...props} className="font-semibold text-gray-900" />
                                  ),
                                  // Customize code blocks
                                  code: ({ ...props }) => (
                                    <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : isToolCall ? (
                            <div className="font-mono text-sm bg-blue-100 px-2 py-1 rounded border">
                              {message.content}
                            </div>
                          ) : (
                            <div className={""}>
                              {message.content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 text-gray-900 max-w-md px-4 py-3 rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2 text-accent">{currentAgent.name} is thinking...</div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto scroll anchor */}
                <div ref={messagesEndRef} />

              </div>

            </main>

            {/* Input Area */}
            <div className="bg-white fixed bottom-20 w-full max-w-xl place-self-center">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isLoading ? `${currentAgent.name} is thinking...` : `Message ${currentAgent.name}...`}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors ${isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
                    }`}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Agent Modal */}
      <EditAgentModal
        agent={editingAgent}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAgent}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        agent={knowledgeBaseAgent}
        isOpen={isKnowledgeBaseModalOpen}
        onClose={() => setIsKnowledgeBaseModalOpen(false)}
      />

      {/* Employee Profiles Modal */}
      <EmployeeProfilesModal
        isOpen={isEmployeeProfilesModalOpen}
        onClose={() => setIsEmployeeProfilesModalOpen(false)}
      />

      {/* Delete Thread Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Conversation
              </h3>
              <p className="text-gray-600 mb-6">
                {`Are you sure you want to delete "${threadToDelete?.title}"? This action cannot be undone and will permanently remove all messages in this conversation.`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteThread}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteThread}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

