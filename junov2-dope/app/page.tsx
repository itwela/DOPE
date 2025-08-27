"use client";

import { useEffect, useRef } from "react";
import { useAgent } from "./providers/agentProvider";

export default function Home() {
  const { 
    agents,
    currentAgent,
    setCurrentAgent,
    messages, 
    inputMessage, 
    setInputMessage, 
    isLoading, 
    handleSendMessage 
  } = useAgent();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="w-[30vw] h-screen bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Agents</h2>
          <p className="text-sm text-gray-600 mt-1">Select an agent to chat with</p>
        </div>
        
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Agent Cards */}
          {agents.map((agent) => (
            <div 
              key={agent._id}
              onClick={() => setCurrentAgent(agent)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentAgent?._id === agent._id ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    {agent.name}
                    {currentAgent?._id === agent._id && <div className="w-2 h-2 bg-accent rounded-full"></div>}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{agent.model}</span>
                    <span>Temp: {agent.temperature}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Create New Agent Button */}
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
        </div>
      </div>

      <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
                         <div>
               <h1 className="text-2xl font-bold text-gray-900">DOPE Agent Playground</h1>
               <p className="text-gray-600 text-sm">Chatting with {currentAgent.name}</p>
             </div>
            <div className="text-right">
              {/* <div className="text-sm text-gray-500">{steve.model}</div>
              <div className="text-xs text-gray-400">Temp: {steve.temperature}</div> */}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                                 <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">{`👋 Hey, I'm ${currentAgent.name}!`}</h3>
                   <p className="text-gray-600 mb-4">{currentAgent.description}</p>
                   <p className="text-gray-500 text-sm">Start chatting by typing a message below!</p>
                 </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-accent text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                                       <div className="text-sm font-medium mb-1">
                     {message.role === "user" ? "You" : currentAgent.name}
                   </div>
                    <div>{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                               <div className="bg-white border border-gray-200 text-gray-900 max-w-md px-4 py-3 rounded-lg">
                 <div className="text-sm font-medium mb-1">{currentAgent.name}</div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Message ${currentAgent.name}...`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}


