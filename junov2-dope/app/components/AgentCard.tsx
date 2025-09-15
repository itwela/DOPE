"use client";

import { useEffect } from "react";
import { AgentCardProps } from "./componetInterfaces";
import { AgentThreadItem } from "./AgentThreadItem";

export const AgentCard = ({ agent, currentAgent, onSelect, onEdit, onOpenKnowledgeBase, recentThreads, onSelectThread, onDeleteThread, onToggleExpanded, currentThreadId, isExpanded, threadCount, startNewThread, isLoadingThreads }: AgentCardProps) => {
    const isSelected = currentAgent?._id === agent._id;
    const isDisabled = agent.name === "Juno"; // Disable Juno
  
    useEffect(() => {
      console.log("onEdit", onEdit);
    }, [recentThreads])
  
    return (
      <div
        onClick={() => {
          if (isDisabled) return;
          if (typeof onSelect === 'function') onSelect(agent);
        }}
        className={`p-4 rounded-lg border-2 transition-all relative group ${isDisabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : isSelected
              ? 'border-[#EB1416] bg-[#EB1416]/5 cursor-pointer'
              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}
      >
        {/* Action Icons */}
        <div className="absolute top-3 right-3 flex gap-1">
          {/* Brain Icon - Knowledge Base */}
          <button
            onClick={(e) => !isDisabled && onOpenKnowledgeBase(agent, e)}
            className={`p-1.5 rounded-md group-hover:opacity-100 transition-all duration-200 ${isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
              }`}
            title={isDisabled ? "Coming soon" : "View knowledge base"}
            disabled={isDisabled}
          >
            <svg
              className={`w-4 h-4 ${isDisabled ? 'text-gray-400' : 'text-[#EB1416] hover:text-purple-700'}`}
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
                <div className="bg-[#EB1416] font-bold text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium">
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
              {/* Start New Thread Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startNewThread();
                }}
                className="text-xs cursor-pointer bg-[#EB1416] hover:bg-[#EB1416] text-white px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
                title="Start new conversation"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
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
  
              {/* Show More/Less Button - appears under threads */}
              {!isLoadingThreads && recentThreads.length > 3 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={(e) => onToggleExpanded(agent._id, e)}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    title={isExpanded ? "Show less" : "Show all"}
                  >
                    {isExpanded ? "Show less ⌄" : "Show more •••"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };