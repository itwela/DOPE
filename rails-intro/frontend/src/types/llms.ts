import { Message } from "../components/ChatWindow";
import React from "react";

export interface LLMData {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface LLMContextType {
    placeHolderMessage: string;
    selectedCompany: Company | null;
    setSelectedCompany: React.Dispatch<React.SetStateAction<Company | null>>;
    testCompanies: Company[];
    setTestCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
    loading: boolean;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    clearMessages: () => void;
    loadCompanies: () => Promise<void>;
    generateMarketingPlan: (company: Company | null) => Promise<string>;
}

export interface Company {
    id: number;
    name: string;
    website: string;
    location?: string;
    weather_data?: any;
    bigsender: boolean;
}