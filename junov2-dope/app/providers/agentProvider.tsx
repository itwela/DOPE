'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface Agent {
    _id: Id<"agents">;
    _creationTime: number;
    name: string;
    description: string;
    instructions: string;
    model: string;
    temperature: number;
    isDefault?: boolean;
}

export interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

export interface ContentBlock {
    text?: string;
    content?: string;
    type?: string;
    providerOptions?: Record<string, Record<string, unknown>>;
    providerMetadata?: Record<string, Record<string, unknown>>;
    mimeType?: string;
    image?: string | ArrayBuffer;
    result?: {
        value?: string;
        text?: string;
    };
    args?: unknown;
    toolName?: string;
}

export interface ThreadMessage {
    _creationTime: number;
    id?: string;
    userId?: string;
    embeddingId?: string;
    fileIds?: string[];
    error?: string;
    agentName?: string;
    model?: string;
    text?: string;
    finishReason?: string;
    tool: boolean;
    message?: {
        role: string;
        content: string | ContentBlock[] | { text: string };
        providerOptions?: Record<string, Record<string, unknown>>;
    };
}

interface AgentContextType {
    agents: Agent[];
    currentAgent: Agent | null;
    setCurrentAgent: (agent: Agent) => void;
    threadId: string | null;
    messages: Message[];
    welcomeMessage: string | null;
    inputMessage: string;
    setInputMessage: (message: string) => void;
    isLoading: boolean;
    handleSendMessage: () => Promise<void>;
    isEditModalOpen: boolean;
    setIsEditModalOpen: (isOpen: boolean) => void;
    editingAgent: Agent | null;
    setEditingAgent: (agent: Agent | null) => void;
    handleEditAgent: (agent: Agent, e: React.MouseEvent) => void;
    handleSaveAgent: (updatedAgent: Partial<Agent>) => void;
    loadExistingThread: (agent: Agent, threadId: string) => void;
    deleteExistingThread: (threadId: string) => Promise<void>;
    startNewThread: () => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

interface AgentProviderProps {
    children: ReactNode;
}

export default function AgentProvider({ children }: AgentProviderProps) {
    
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [agentThreads, setAgentThreads] = useState<Record<string, string>>({});
    
    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    const getDefaultAgents = useMutation(api.myFunctions.getDefaultAgents);
    const createSteveThread = useAction(api.dopeAgents.createSteveThread);
    const createJunoThread = useAction(api.dopeAgents.createJunoThread);
    const sendMessage = useMutation(api.dopeAgents.sendMessage);
    const deleteThread = useAction(api.dopeAgents.deleteThread);
    
    // Query for thread messages (only for agents with valid thread IDs)
    const threadMessages = useQuery(
        api.dopeAgents.listThreadMessages,
        threadId && !threadId.startsWith("thread-") ? { 
            threadId, 
            paginationOpts: { numItems: 50, cursor: null } 
        } : "skip"
    );

    // Initialize agents on component mount
    useEffect(() => {
        getDefaultAgents({}).then((agentList) => {
            setAgents(agentList);
            // Set Steve as default current agent
            const steve = agentList.find(agent => agent.name === "Steve");
            if (steve) {
                setCurrentAgent(steve);
            }
        });
    }, [getDefaultAgents]);

    // Helper function to get agent welcome message
    const getAgentWelcome = (agent: Agent): string => {
        switch (agent.name) {
            case "Steve":
                return "Hello! I'm Steve, your AI leadership consultant for DOPE Marketing. How can I help you today?";
            case "Juno":
                return "Hey there! I'm Juno, How can I help you today?"; // Revert to original
            default:
                return `Hello! I'm ${agent.name}. ${agent.description} How can I help you today?`;
        }
    };

    // Helper function to determine if agent supports AI features
    const isAIAgent = (agentName: string): boolean => {
        return ["Steve", "Juno"].includes(agentName);
    };

    // Create or restore thread when current agent changes
    useEffect(() => {
        if (!currentAgent) return;
        
        // Check if we already have a thread for this agent
        const existingThreadId = agentThreads[currentAgent._id];
        
        // Reset state when switching agents
        setMessages([]);
        setWelcomeMessage(null);
        
        if (existingThreadId) {
            // Restore existing thread
            setThreadId(existingThreadId);
            if (!isAIAgent(currentAgent.name)) {
                setWelcomeMessage(getAgentWelcome(currentAgent));
            } else {
                // For AI agents with existing threads, don't show welcome message
                setWelcomeMessage(null);
            }
        } else {
            // For all agents (AI and basic), just show welcome message - NO thread creation
            setThreadId(null);
            setWelcomeMessage(getAgentWelcome(currentAgent));
        }
    }, [currentAgent]);

    // Update messages when thread messages change (for AI agents with real threads)
    useEffect(() => {
        if (threadMessages?.page && currentAgent && isAIAgent(currentAgent.name)) {
            // Convert thread messages to our Message format
            const convertedMessages: Message[] = threadMessages.page
                .map((msg: ThreadMessage) => {
                    // Extract content from ALL possible formats - NO FILTERING
                    let content = '';
                    
                    // Check direct text field first
                    if (msg.text && typeof msg.text === 'string' && msg.text.trim()) {
                        content = msg.text;
                    } else if (typeof msg.message?.content === 'string') {
                        content = msg.message.content;
                    } else if (Array.isArray(msg.message?.content)) {
                        // Extract ALL content from array - including tool calls and results
                        const allBlocks = msg.message.content
                            .map((block: ContentBlock) => {
                                if (typeof block === 'string') return block;
                                if (block?.text) return block.text;
                                if (block?.content) return block.content;
                                if (block?.result?.value) return block.result.value;
                                if (block?.result?.text) return block.result.text;
                                if (block?.args) return `Tool: ${block.toolName || 'Unknown'} - ${JSON.stringify(block.args)}`;
                                return '';
                            })
                            .filter(Boolean);
                        
                        content = allBlocks.join(' ').trim();
                    } else if (msg.message?.content?.text) {
                        content = msg.message.content.text;
                    }
                    
                    // If still no content, use a placeholder based on message type
                    if (!content) {
                        if (msg.message?.role === 'tool') {
                            content = '[Tool Response]';
                        } else if (msg.finishReason === 'tool-calls') {
                            content = '[Using tools...]';
                        } else {
                            content = '...';
                        }
                    }
                    
                    return {
                        role: msg.message?.role || 'system',
                        content,
                        timestamp: msg._creationTime || Date.now()
                    };
                })
                .filter((msg): msg is Message => msg !== null);
            
            // Sort messages by timestamp (oldest first)
            const sortedMessages = convertedMessages.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sortedMessages);
        }
    }, [threadMessages, currentAgent]);

    /* --------------------------------------------------------------------------

    REVIEW RAG STUFF ------------------------------------------------------------

    -------------------------------------------------------------------------- */



    // const insertDataIntoKnowledgeBase = useMutation(api.myFunctions.insertDataIntoKnowledgeBase);


    // Modal handlers
    const handleEditAgent = (agent: Agent, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent agent selection
        setEditingAgent(agent);
        setIsEditModalOpen(true);
    };

    const handleSaveAgent = (updatedAgent: Partial<Agent>) => {
        // TODO: Implement agent update functionality with Convex mutation
        console.log("Saving agent:", updatedAgent);
        // This will be implemented with a Convex mutation later
        setIsEditModalOpen(false);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage("");
        setIsLoading(true);

        try {
            if (currentAgent && isAIAgent(currentAgent.name)) {
                // If no thread exists, create one first
                if (!threadId) {
                    let newThreadResult;
                    if (currentAgent.name === "Steve") {
                        newThreadResult = await createSteveThread({
                            title: `Chat with ${currentAgent.name}`,
                            userId: "user-1" // Placeholder - in real app, get from auth
                        });
                    } else if (currentAgent.name === "Juno") {
                        newThreadResult = await createJunoThread({
                            title: `Creative Session with ${currentAgent.name}`,
                            userId: "user-1" // Placeholder - in real app, get from auth
                        });
                    }

                    if (newThreadResult) {
                        setThreadId(newThreadResult.threadId);
                        setWelcomeMessage(newThreadResult.welcomeMessage);
                        setAgentThreads(prev => ({
                            ...prev,
                            [currentAgent._id]: newThreadResult.threadId
                        }));

                        // Send message to the new thread
                        sendMessage({
                            threadId: newThreadResult.threadId,
                            prompt: userMessage,
                            userId: "user-1", // Placeholder - in real app, get from auth
                            agentName: currentAgent.name
                        });
                    }
                } else if (!threadId.startsWith("thread-")) {
                    // Use existing thread for AI agents with valid thread IDs
                    sendMessage({
                        threadId,
                        prompt: userMessage,
                        userId: "user-1", // Placeholder - in real app, get from auth
                        agentName: currentAgent.name
                    });
                }
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsLoading(false);
        }
    };

    const loadExistingThread = (agent: Agent, existingThreadId: string) => {
        // Only reload if it's a different thread or different agent
        if (currentAgent?._id !== agent._id || threadId !== existingThreadId) {
            setCurrentAgent(agent);
            setThreadId(existingThreadId);
            setMessages([]);
            setWelcomeMessage(null);
            // Update the agent threads mapping to remember this thread
            setAgentThreads(prev => ({
                ...prev,
                [agent._id]: existingThreadId
            }));
        }
        // If it's the same thread and agent, do nothing - keep existing messages
    };

    const deleteExistingThread = async (threadId: string) => {
        try {
            // Call the Convex API to delete the thread
            await deleteThread({
                threadId,
                userId: "user-1" // Placeholder - in real app, get from auth
            });
            
            // Clear local state for this thread
            setMessages([]);
            // If this was the current thread, clear it
            if (threadId === threadId) {
                setThreadId(null);
                setWelcomeMessage(null);
            }
        } catch (error) {
            console.error("Failed to delete thread:", error);
        }
    };

    const startNewThread = () => {
        if (!currentAgent) return;
        
        // Remove current thread from agent threads mapping
        setAgentThreads(prev => {
            const updated = { ...prev };
            delete updated[currentAgent._id];
            return updated;
        });
        
        // Clear current thread state
        setThreadId(null);
        setMessages([]);
        setWelcomeMessage(getAgentWelcome(currentAgent));
    };

    const value: AgentContextType = {
        agents,
        currentAgent,
        setCurrentAgent,
        threadId,
        messages,
        welcomeMessage,
        inputMessage,
        setInputMessage,
        isLoading,
        handleSendMessage,
        isEditModalOpen,
        setIsEditModalOpen,
        editingAgent,
        setEditingAgent,
        handleEditAgent,
        handleSaveAgent,
        loadExistingThread,
        deleteExistingThread,
        startNewThread,
    };

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error("useAgent must be used within an AgentProvider");
    }
    return context;
}