"use client";

import { Agent } from "../providers/AgentProvider";
import { Thread } from "./componetInterfaces";
import React from "react";

export const AgentThreadItem = ({ agent, thread, currentThreadId, onSelectThread, onDeleteThread }: { agent: Agent, thread: Thread, currentThreadId: string | null, onSelectThread: (agent: Agent, threadId: string) => void, onDeleteThread: (threadId: string, e: React.MouseEvent, threadTitle?: string) => Promise<void> }) => {
    const isThreadSelected = currentThreadId === thread._id;
    return (
      <>
        <div className={`flex items-center justify-between rounded-md px-2 py-1 transition-colors ${isThreadSelected
            ? 'bg-[#EB1416] text-white'
            : 'hover:text-white hover:bg-[#EB1416]'
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