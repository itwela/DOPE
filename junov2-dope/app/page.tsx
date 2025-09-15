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
// import ExpandedTabs from "./components/ExpandedTabs";
import ReactMarkdown from 'react-markdown';
// import { CreateNewAgentButton } from "./components/CreateNewAgentButton";
import { AgentCard } from "./components/AgentCard";
import { AbilitiesForAgent } from "./components/WebsiteAnalysisButton";
import { InterviewQuestions, InterviewQuestion } from "./components/componetInterfaces";
import { Drawer } from "./components/Drawer";
// Client-safe tool names (no Convex imports)
import { toolNamesByAgent } from "@/app/toolDirectory";


export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  // Check authentication status (boolean | undefined)
  const isAuthed = useQuery(api.auth.isAuthenticated, {});
  // Current user identity (name/email)
  const currentUserInfo = useQuery(api.auth.currentUser, {});
  const authedUserId = currentUserInfo?.subject ? currentUserInfo.subject.split("|")[0] : undefined;

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (isAuthed === undefined) return;
    if (isAuthed === false) {
      router.push("/signin");
    }

    console.log("authedUserId length", authedUserId?.length);
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
  // Ensure Juno appears last in agent listings
  const sortedAgents = agents.slice().sort((a, b) => {
    const aIsJuno = a.name === 'Juno' ? 1 : 0;
    const bIsJuno = b.name === 'Juno' ? 1 : 0;
    return aIsJuno - bIsJuno;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Knowledge Base Modal state
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false);
  const [knowledgeBaseAgent, setKnowledgeBaseAgent] = useState<Agent | null>(null);

  // Employee Profiles Modal state
  const [isEmployeeProfilesModalOpen, setIsEmployeeProfilesModalOpen] = useState(false);

  // Interview Questions state
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestions | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<{ [key: number]: string }>({});

  // Thread management state
  const [expandedThreadsAgent, setExpandedThreadsAgent] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);

  // Voice recording UI + state
  const [isVoicePaneOpen, setIsVoicePaneOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [vuLevel, setVuLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Array<Blob>>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Query for recent threads for the current agent
  const recentThreads = useQuery(
    api.dopeAgents.getRecentThreads,
    currentAgent && authedUserId ? {
      userId: authedUserId,
      agentName: currentAgent.name,
      limit: expandedThreadsAgent === currentAgent._id ? 20 : 5
    } : "skip"
  );

  // Derive selected thread title from recent threads
  const selectedThreadTitle = (() => {
    if (!threadId || !recentThreads || threadId.startsWith("thread-")) return null;
    const t = recentThreads.find((th) => th._id === threadId);
    return t ? (t.title || t.summary || "Untitled conversation") : null;
  })();

  // Query for thread counts for all agents (for the badges)
  const allThreadCounts = useQuery(
    api.dopeAgents.getRecentThreads,
    authedUserId ? {
      userId: authedUserId,
      limit: 100
    } : "skip"
  );

  const handleOpenKnowledgeBase = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setKnowledgeBaseAgent(agent);
    setIsKnowledgeBaseModalOpen(true);
  };

  const handleSelectThread = (agent: Agent, selectedThreadId: string) => {
    // console.log("Selected thread length:", selectedThreadId.length, "for agent:", agent.name);
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

  const stopMeters = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;
  };

  const updateVuLoop = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    // Compute RMS-like level 0..1
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128; // -1..1
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLength);
    setVuLevel(Math.min(1, Math.max(0, rms)));
    rafIdRef.current = requestAnimationFrame(updateVuLoop);
  };

  const startRecording = async () => {
    setRecordingError(null);
    try {
      setIsVoicePaneOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup meters
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);
      updateVuLoop();

      // Recorder
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data as Blob);
        }
      };
      recorder.onstop = async () => {
        stopMeters();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadForTranscription(blob);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setRecordingError("Microphone not available or permission denied.");
      setIsVoicePaneOpen(true);
      setIsRecording(false);
      stopStreams();
      stopMeters();
    }
  };

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    stopStreams();
  };

  const cancelRecording = () => {
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    chunksRef.current = [];
    stopStreams();
    stopMeters();
    setIsVoicePaneOpen(false);
  };

  const uploadForTranscription = async (blob: Blob) => {
    try {
      // Show processing state while pane stays open
      const file = new File([blob], 'recording.webm', { type: blob.type || 'audio/webm' });
      const form = new FormData();
      form.append('file', file);
      form.append('language', 'en');
      const res = await fetch('/api/transcribe', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      const text: string = data.text || '';
      setInputMessage((inputMessage ? `${inputMessage} ${text}` : text));
      setIsVoicePaneOpen(false);
      if (text) showToast('Transcription added to input', 'success');
    } catch (err) {
      console.error(err);
      setRecordingError(err instanceof Error ? err.message : 'Failed to transcribe');
    }
  };

  const MicrophoneIcon = () => {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"></path>
        <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 006 6.92V21H9a1 1 0 100 2h6a1 1 0 100-2h-2v-3.08A7 7 0 0019 11z"></path>
      </svg>
    );
  };

  const handleTranscribe = () => {
    if (!isVoicePaneOpen) {
      void startRecording();
      return;
    }
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const handleReturnArrayOfAvailableTools = () => {
    if (!currentAgent?.name) return [];
    return toolNamesByAgent[currentAgent.name] ?? [];
  };

  useEffect(() => {
    return () => {
      stopStreams();
      stopMeters();
    };
  }, []);

  // Auto-resize input textarea as content changes
  useEffect(() => {
    const el = inputTextAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [inputMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("currentAgent", currentAgent);
    console.log("available tools", handleReturnArrayOfAvailableTools());
    setAvailableTools(handleReturnArrayOfAvailableTools());
  }, [currentAgent]);

  // Ensure selection stays valid when available tools change
  useEffect(() => {
    if (selectedToolName && !availableTools.includes(selectedToolName)) {
      setSelectedToolName(null);
    }
  }, [availableTools]);

  // Show loading state while checking authentication or loading current agent
  if (isAuthed === undefined || !currentAgent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EB1416]"></div>
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

        {/* SECTION: Agent Selector Sidebar */}
        <div className="lg:w-[30vw] hidden lg:block h-screen bg-white flex flex-col">

          <div className="flex p-4 justify-between w-full">

            <div className="flex flex-col w-max justify-between">
              <h2 className="text-sm font-bold text-[#EB1416]">Your Agents</h2>
              <p className="text-xs text-gray-600 mt-1">Select an agent to chat with</p>
            </div>

            <div className="relative">

              <button
                type="button"
                onClick={() => setIsUserDrawerOpen((v) => !v)}
                className="w-8 h-8 cursor-pointer rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold select-none"
                title={(currentUserInfo as unknown as { email: string })?.email || "Account"}
              >
                {((currentUserInfo as unknown as { email: string })?.email || "?")
                  .toString()
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "?"}
              </button>
              {isUserDrawerOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => { setIsUserDrawerOpen(false); setIsEmployeeProfilesModalOpen(true); }}
                  >
                    Employee Profiles
                  </button>
                  {/* TODO */}
                  {/* <button
                    type="button"
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserDrawerOpen(false)}
                  >
                    Settings
                  </button> */}
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => { setIsUserDrawerOpen(false); void signOut(); }}
                  >
                    Log out
                  </button>
                </div>
              )}

            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Agent Cards */}
            {sortedAgents.map((agent) => (
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
            {/* <CreateNewAgentButton/> */}
          </div>

          <div className="p-4 w-full"></div>

        </div>

        {/* SECTION: Chat Container */}
        <div className="lg:w-[70vw] w-full h-screen relative overflow-y-scroll">

          {/* SECTION: Header */}
          <header className="fixed lg:w-[70vw] w-full z-50 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="justify-self-start">

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    className="lg:hidden w-8 h-8 cursor-pointer rounded-md flex items-center justify-center hover:bg-gray-100"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    title="Open menu"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  <div className="hidden lg:block">
                    <h1 className="text-sm font-bold text-[#EB1416]">DOPE Agent Playground</h1>
                    <p className="text-gray-600 text-xs">Chatting with {currentAgent.name}</p>
                  </div>

                </div>

              </div>
              <div className="justify-self-center">
                {selectedThreadTitle && (
                  <div className="text-sm flex flex-col font-semibold text-gray-900 text-center truncate max-w-xs mx-auto">
                    <h1 className="text-sm font-bold text-[#EB1416]">DOPE Agent Playground</h1>
                    {selectedThreadTitle}
                  </div>
                )}

                {!selectedThreadTitle && (
                  <div className="items-center flex flex-col lg:hidden w-max">
                    <h1 className="text-sm font-bold text-[#EB1416]">DOPE Agent Playground</h1>
                    <p className="text-gray-600 text-xs">Chatting with {currentAgent.name}</p>
                  </div>
                )}
              </div>
              <div className="justify-self-end">
                <div className="flex items-center gap-2">
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 cursor-pointer text-sm text-gray-600 hover:text-[#EB1416] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden lg:block">
                  Sign out
                  </span>
                </button>
                </div>
              </div>
            </div>
          </header>

          {/* NOTE: Mobile Drawer */}
          <div className="lg:hidden">

            <Drawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} direction="left">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-[#EB1416]">Your Agents</h2>
                    <p className="text-xs text-gray-600 mt-1">Select an agent to chat with</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="w-8 h-8 cursor-pointer rounded-md flex items-center justify-center hover:bg-gray-100"
                    title="Close"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sortedAgents.map((agent) => (
                    <AgentCard
                      key={agent._id}
                      agent={agent}
                      currentAgent={currentAgent}
                      onSelect={(a) => { handleAgentSelect(a); setIsMobileDrawerOpen(false); }}
                      onEdit={handleEditAgent}
                      onOpenKnowledgeBase={handleOpenKnowledgeBase}
                      recentThreads={currentAgent?._id === agent._id ? (recentThreads || []) : []}
                      onSelectThread={(a, t) => { handleSelectThread(a, t); setIsMobileDrawerOpen(false); }}
                      onDeleteThread={handleDeleteThread}
                      onToggleExpanded={handleToggleThreadsExpanded}
                      currentThreadId={threadId}
                      isExpanded={expandedThreadsAgent === agent._id}
                      threadCount={getThreadCountForAgent(agent.name)}
                      startNewThread={() => { startNewThread(); setIsMobileDrawerOpen(false); }}
                      isLoadingThreads={!recentThreads && currentAgent?._id === agent._id}
                    />
                  ))}
                </div>

                <div className="p-4 border-t"></div>
              </div>
            </Drawer>

          </div>

          <div className="h-[100px]"></div>

          {/* SECTION: Chat Area */}
          <div className="min-h-screen overflow-hidden w-full bg-gray-50 flex flex-col">

            {/* NOTE: Chat Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col lg:pb-[10%] pb-[20%]">
              {/* NOTE: Messages */}
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
                        <div className="flex mb-[10%] sm:mb-8 md:mb-4 max-w-md items-center justify-start gap-2">

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
                                  <div key={index} className="border-l-4 border-[#EB1416] pl-4">
                                    <div className="flex items-start gap-2">
                                      <span className="bg-[#EB1416] text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
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
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EB1416] focus:border-transparent resize-none"
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
                        className={`px-4 py-3 rounded-lg relative group ${message.role === "user"
                          ? "max-w-[70vw] lg:max-w-md bg-[#EB1416] text-white"
                          : isToolCall
                            ? "w-full bg-blue-50 border border-blue-200 text-blue-800"
                            // : isSystemMessage
                            //   ? "bg-gray-50 border border-gray-200 text-gray-600"
                            : "w-full bg-white border border-gray-200 text-gray-900"
                          }`}
                      >
                        {/* Copy button - show for all non-user messages */}
                        {message.role !== "user" && (
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="absolute cursor-pointer top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-200"
                            title="Copy message"
                          >
                            <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}

                        <div className="text-sm  font-medium mb-1 flex items-center gap-2">
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
                      <div className="text-sm font-medium mb-2 text-[#EB1416]">{currentAgent.name} is thinking...</div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-[#EB1416] text-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#EB1416] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-[#EB1416] text-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto scroll anchor */}
                <div ref={messagesEndRef} />

              </div>

            </main>

            {/* NOTE: Input Area */}
            <div className=" fixed bottom-[2%] w-[90vw] lg:w-full rounded-lg max-w-xl place-self-center bg-gray-50 py-4 px-4">
              {/* NOTE: Available Tools Area */}
              {availableTools.length > 0 && (
                <div className="mb-2 flex w-full gap-2">
                  <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsToolsMenuOpen((v) => !v)}
                      className="w-max px-2 h-8 cursor-pointer bg-gray-500 text-white border border-[#EB1416]/50 rounded-md flex items-center justify-center hover:bg-gray-400"
                      title="Select tool"
                      aria-haspopup="menu"
                      aria-expanded={isToolsMenuOpen}
                    >
                      <span className="text-sm select-none">Tools:</span>
                    </button>
                    {isToolsMenuOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        {availableTools.map((toolName) => (
                          <button
                            key={toolName}
                            type="button"
                            className={`w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 ${selectedToolName === toolName ? 'bg-gray-50 text-[#EB1416] font-medium' : 'text-gray-700'}`}
                            onClick={() => { setSelectedToolName(toolName); setIsToolsMenuOpen(false); }}
                          >
                            {toolName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedToolName && (
                    <div className="bg-[#EB1416] text-white border border-[#EB1416]/50 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2 h-8">
                      <span className="text-sm select-none font-medium">{selectedToolName}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedToolName(null)}
                        className="w-5 h-5 flex cursor-pointer items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xs"
                        title="Clear selected tool"
                        aria-label="Clear selected tool"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* NOTE: Voice Input Area */}
              {isVoicePaneOpen && (
                <div className="mb-2 w-full">
                  <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-gray-900">
                          {isRecording ? 'Recording...' : 'Processing...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <button
                            type="button"
                            onClick={() => void stopRecording()}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md"
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsVoicePaneOpen(false)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                          >
                            Close
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void cancelRecording()}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                          disabled={!isRecording}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex w-full justify-between items-end gap-1 h-8">
                        {Array.from({ length: 46 }).map((_, i) => (
                          <div
                            key={i}
                            style={{ height: `${Math.max(3, Math.min(28, vuLevel * 28 + ((i % 3) * 4)))}px` }}
                            className="w-1 bg-[#EB1416] rounded-sm"
                          />
                        ))}
                      </div>
                      {recordingError && (
                        <div className="mt-2 text-xs text-red-600">{recordingError}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 items-end">
                {/* 
                
                */}
                <textarea
                  ref={inputTextAreaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(selectedToolName ? selectedToolName : undefined);
                    }
                  }}
                  placeholder={isLoading ? `${currentAgent.name} is thinking...` : `Message ${currentAgent.name}...`}
                  rows={1}
                  className={`flex-1 bg-white px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#EB1416] focus:border-transparent transition-colors resize-none min-h-[44px] ${isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {/* 
                  
                */}
                <button
                  type="button"
                  onClick={handleTranscribe}
                  className={`w-10 h-10 cursor-pointer rounded-lg border ${isRecording ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'} flex items-center justify-center`}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                  aria-label={isRecording ? "Stop recording" : "Start voice input"}
                >
                  <MicrophoneIcon />
                </button>
                {/* 
                  
                */}
                <button
                  onClick={() => handleSendMessage(selectedToolName ? selectedToolName : undefined)}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-[#EB1416] hover:bg-[#EB1416] text-white px-6 py-2 rounded-lg h-10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isLoading || (isVoicePaneOpen && !isRecording)) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
               {/* 
                  
                */}
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

