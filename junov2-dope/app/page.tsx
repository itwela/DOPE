"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAgent, Agent } from "./providers/AgentProvider";
import { useToast } from "./providers/ToastProvider";
import EditAgentModal from "./components/EditAgentModal";
import KnowledgeBaseModal from "./components/KnowledgeBaseModal";
import EmployeeProfilesModal from "./components/EmployeeProfilesModal";
import ReactMarkdown from 'react-markdown';


export default function Home() {
  const {
    agents,
    currentAgent,
    setCurrentAgent,
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
  } = useAgent();

  const { showToast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Knowledge Base Modal state
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false);
  const [knowledgeBaseAgent, setKnowledgeBaseAgent] = useState<Agent | null>(null);

  // Employee Profiles Modal state
  const [isEmployeeProfilesModalOpen, setIsEmployeeProfilesModalOpen] = useState(false);

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

  if (!currentAgent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
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
                onSelect={setCurrentAgent}
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

            {/* Create New Agent Button */}
            {createNewAgentButton()}
          </div>
        </div>

        <div className="w-full h-screen relative overflow-y-scroll">

          {/* Header */}
          <header className="fixed w-full z-50 px-6 py-4 ">
            {/* <header className="fixed w-full z-50 px-6 py-4 backdrop-blur-md "> */}
            <div className="flex items-center justify-start gap-4">
              <div>
                <h1 className="text-sm font-bold text-[#EB1416]">DOPE Agent Playground</h1>
                <p className="text-gray-600 text-xs">Chatting with {currentAgent.name}</p>
              </div>

            </div>
          </header>

          <div className="h-[100px]"></div>

          <div className="min-h-screen overflow-hidden w-full bg-gray-50 flex flex-col">


            {/* Chat Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col pb-[10%]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                {messages.length === 0 && welcomeMessage ? (
                  <div className="flex justify-start">
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
                        className={`max-w-md px-4 py-3 rounded-lg relative group ${
                          message.role === "user"
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
                          )  : (
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
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors ${
                    isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
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
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteThread}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface Thread {
  _id: string;
  _creationTime: number;
  userId?: string;
  title?: string;
  summary?: string;
  status: "active" | "archived";
}

interface AgentCardProps {
  agent: Agent;
  currentAgent: Agent | null;
  onSelect: (agent: Agent) => void;
  onEdit: (agent: Agent, e: React.MouseEvent) => void;
  onOpenKnowledgeBase: (agent: Agent, e: React.MouseEvent) => void;
  recentThreads: Thread[];
  onSelectThread: (agent: Agent, threadId: string) => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent, threadTitle?: string) => Promise<void>;
  onToggleExpanded: (agentId: string, e: React.MouseEvent) => void;
  currentThreadId: string | null;
  isExpanded: boolean;
  threadCount: number;
  startNewThread: () => void;
  isLoadingThreads: boolean;
}

const AgentCard = ({ agent, currentAgent, onSelect, onEdit, onOpenKnowledgeBase, recentThreads, onSelectThread, onDeleteThread, onToggleExpanded, currentThreadId, isExpanded, threadCount, startNewThread, isLoadingThreads }: AgentCardProps) => {
  const isSelected = currentAgent?._id === agent._id;
  const isDisabled = agent.name === "Juno"; // Disable Juno

  useEffect(() => {
    console.log("onEdit", onEdit);
  }, [recentThreads])

  return (
    <div
      onClick={() => !isDisabled && onSelect(agent)}
      className={`p-4 rounded-lg border-2 transition-all relative group ${
        isDisabled 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
          : isSelected 
            ? 'border-accent bg-accent/5 cursor-pointer' 
            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
      }`}
    >
      {/* Action Icons */}
      <div className="absolute top-3 right-3 flex gap-1">
        {/* Brain Icon - Knowledge Base */}
        <button
          onClick={(e) => !isDisabled && onOpenKnowledgeBase(agent, e)}
          className={`p-1.5 rounded-md group-hover:opacity-100 transition-all duration-200 ${
            isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
          }`}
          title={isDisabled ? "Coming soon" : "View knowledge base"}
          disabled={isDisabled}
        >
          <svg
            className={`w-4 h-4 ${isDisabled ? 'text-gray-400' : 'text-accent hover:text-purple-700'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </button>

        {/* REVIEW Gear Icon - Edit */}
        {/* <button
          onClick={(e) => !isDisabled && onEdit(agent, e)}
          className={`p-1.5 rounded-md group-hover:opacity-100 transition-all duration-200 ${
            isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
          }`}
          title={isDisabled ? "Coming soon" : "Edit agent"}
          disabled={isDisabled}
        >
          <svg
            className={`w-4 h-4 ${isDisabled ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button> */}
      </div>

      <div className="flex items-start justify-between pr-16">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            {agent.name}
            {threadCount > 0 && (
              <div className="bg-accent font-bold text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium">
                {threadCount}
              </div>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Recent Threads */}
      {isSelected && (isLoadingThreads || recentThreads.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-700">Recent Conversations</h4>
            <div className="flex items-center gap-1">
              {/* Start New Thread Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startNewThread();
                }}
                className="text-xs cursor-pointer bg-accent hover:bg-accent-hover text-white px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
                title="Start new conversation"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              {recentThreads.length > 3 && (
                <button
                  onClick={(e) => onToggleExpanded(agent._id, e)}
                  className="text-xs text-gray-500 hover:text-gray-700 p-1"
                  title={isExpanded ? "Show less" : "Show all"}
                >
                  {isExpanded ? "⌄" : "•••"}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {isLoadingThreads ? (
              // Loading state
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between hover:bg-gray-50 rounded-md px-2 py-1">
                      <div className="flex-1 pr-6">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Actual threads
              (isExpanded ? recentThreads : recentThreads.slice(0, 3)).map((thread) => {
                // const isThreadSelected = currentThreadId === thread._id;
                return (
                  <AgentThreadItem
                    agent={agent}
                    thread={thread}
                    currentThreadId={currentThreadId}
                    onSelectThread={onSelectThread}
                    onDeleteThread={onDeleteThread}
                    key={thread._id}

                  >

                  </AgentThreadItem>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AgentThreadItem = ({ agent, thread, currentThreadId, onSelectThread, onDeleteThread }: { agent: Agent, thread: Thread, currentThreadId: string | null, onSelectThread: (agent: Agent, threadId: string) => void, onDeleteThread: (threadId: string, e: React.MouseEvent, threadTitle?: string) => Promise<void> }) => {
  const isThreadSelected = currentThreadId === thread._id;
  return (
    <>
    <div className={`flex items-center justify-between rounded-md px-2 py-1 transition-colors ${
        isThreadSelected 
          ? 'bg-accent text-white' 
          : 'hover:text-white hover:bg-accent'
      }`}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectThread(agent, thread._id);
        }}
        className="cursor-pointer flex-1 pr-6"
      >
        <div className="font-medium text-sm truncate">
          {thread.title || thread.summary || "Untitled conversation"}
        </div>
        <div className={`text-xs ${isThreadSelected ? 'text-white/70' : 'text-gray-400'}`}>
          {thread.status} • {new Date(thread._creationTime).toLocaleDateString()}
        </div>
      </div>
      <span
        onClick={(e) => onDeleteThread(thread._id, e, thread.title || thread.summary)}
        className="text-white cursor-pointer w-6 h-6 flex items-center justify-center bg-black/40 rounded-md text-md  pb-1 hover:scale-[1.3]"
        title="Delete conversation"
      >
        ×
      </span>
    </div>
    </>
  );
};

const createNewAgentButton = () => {

  const comingSoon = true;

  return (
    <>
      {comingSoon ? (
        <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Coming Soon</p>
            <p className="text-xs text-gray-500 mt-1">{"We're working on adding new agents soon!"}</p>
          </div>
        </div>
      ) : (
        <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group">
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Create New Agent</p>
            <p className="text-xs text-gray-500 mt-1">Build a custom AI assistant</p>
          </div>
        </button>
      )}
    </>
  );
};