'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
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

interface AgentContextType {
    agents: Agent[];
    currentAgent: Agent | null;
    setCurrentAgent: (agent: Agent) => void;
    conversationId: Id<"conversations"> | null;
    messages: Message[];
    inputMessage: string;
    setInputMessage: (message: string) => void;
    isLoading: boolean;
    handleSendMessage: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | null>(null);

interface AgentProviderProps {
    children: ReactNode;
}

export default function AgentProvider({ children }: AgentProviderProps) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
    const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getDefaultAgents = useMutation(api.myFunctions.getDefaultAgents);
    const getOrCreateConversation = useMutation(api.myFunctions.getOrCreateConversation);
    const getConversation = useQuery(
        api.myFunctions.getConversation,
        conversationId ? { conversationId } : "skip"
    );
    const addMessage = useMutation(api.myFunctions.addMessage);

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

    // Initialize conversation when current agent changes
    useEffect(() => {
        if (currentAgent) {
            getOrCreateConversation({ agentId: currentAgent._id }).then(setConversationId);
        }
    }, [currentAgent, getOrCreateConversation]);

    // Update messages when conversation loads
    useEffect(() => {
        if (getConversation) {
            setMessages(getConversation.messages);
        }
    }, [getConversation]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !conversationId || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage("");
        setIsLoading(true);

        // TODO: ADD ACTUAL AGENT HERE
        try {
            // Add user message
            await addMessage({
                conversationId,
                role: "user",
                content: userMessage,
            });

            // For now, just add a simple response from Steve
            // Later you can integrate with OpenAI or other AI services
            setTimeout(async () => {
                            const response = currentAgent?.name === "Steve" 
                ? `Hey! I'm Steve. You said: "${userMessage}". I'm here to help, but I'm still learning how to respond properly!`
                : `Hi there! I'm Juno. You said: "${userMessage}". Let's get creative and explore some innovative ideas together!`;
                    
                await addMessage({
                    conversationId,
                    role: "assistant",
                    content: response,
                });
                setIsLoading(false);
            }, 1000);
            
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsLoading(false);
        }
    };

    const value: AgentContextType = {
        agents,
        currentAgent,
        setCurrentAgent,
        conversationId,
        messages,
        inputMessage,
        setInputMessage,
        isLoading,
        handleSendMessage,
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