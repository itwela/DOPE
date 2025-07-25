import { Message } from "../dopeComponents/ChatWindow";
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
    screenshotPath: string | null;
    setScreenshotPath: React.Dispatch<React.SetStateAction<string | null>>;
    brandColors: string[];
    setBrandColors: React.Dispatch<React.SetStateAction<string[]>>;
    classifiedImages: unknown[];
    setClassifiedImages: React.Dispatch<React.SetStateAction<unknown[]>>;
    campaignElements: unknown | null;
    setCampaignElements: React.Dispatch<React.SetStateAction<unknown | null>>;
    clearMessages: () => void;
    loadCompanies: () => Promise<void>;
    generateMarketingPlan: (company: Company | null) => Promise<string>;
    talkToAgent: (message: string) => Promise<string>;
}

export interface Company {
    id: number;
    name: string;
    website: string;
    location?: string;
    weather_data?: unknown;
    bigsender: boolean;
}

export interface CampaignElements {
    phoneNumber?: string;
    companyLogoSrcAttribute?: string;
    header: {
        tagline: string;
        tone?: string;
    };
    subHeader?: string;
    valueProposition?: string;
    brandColors: {
        primary?: string;
        secondary?: string;
        accent?: string;
    };
}
