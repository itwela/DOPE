'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LLMContextType, Company } from '../types/llms';
import { Message } from '../dopeComponents/ChatWindow';
import { useToastMessage } from './ToastMessageContext';
import { run, setDefaultOpenAIClient } from '@openai/agents';
import OpenAI from 'openai';
import { dopeMarketingAgent } from './dopeAgents';

const LLMContext = createContext<LLMContextType | null>(null);

interface LLMProviderProps {
  children: ReactNode;
}



export const LLMProvider: React.FC<LLMProviderProps> = ({ children }) => {

  // --
  const placeHolderMessage = 'This is a placeholder AI response. In a real app, I would generate a marketing plan.';
  const [testCompanies, setTestCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I can help you generate a marketing plan. What company are we working with today?", sender: 'ai' }
  ]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [classifiedImages, setClassifiedImages] = useState<unknown[]>([]);
  const [campaignElements, setCampaignElements] = useState<unknown | null>(null);
  const { setToastMessage } = useToastMessage();

  // Configure OpenAI for the Agents SDK
  const apiKey = import.meta.env?.VITE_OPENAI_API_KEY || '';
  if (apiKey) {
    const openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    setDefaultOpenAIClient(openaiClient);
  }

  // --
  const clearMessages = () => {
    setMessages([{ text: "Hello! I can help you generate a marketing plan. What company are we working with today?", sender: 'ai' }]);
    setToastMessage('Conversation cleared');
    setInput('');
  };

  const loadCompanies = async () => {
    setLoading(true);
    setToastMessage('');
    try {
      // Hardcoded companies with bigsender boolean field
      const companies: Company[] = [
        // Big Senders
        {
          id: 1,
          name: 'The Pittsburgh Roofer',
          website: 'https://www.thepittsburghroofer.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Sunny, 75°F',
          bigsender: true
        },
        {
          id: 2,
          name: 'PRQ Exteriors',
          website: 'https://prqexteriors.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Partly Cloudy, 72°F',
          bigsender: true
        },
        {
          id: 3,
          name: 'Matheson Heating',
          website: 'https://www.mathesonheating.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Clear, 78°F',
          bigsender: true
        },
        // Little Senders
        {
          id: 4,
          name: 'Roble Tree Care',
          website: 'https://www.robletreecare.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Overcast, 70°F',
          bigsender: false
        },
        {
          id: 5,
          name: 'Palmer Shine',
          website: 'https://www.palmershine.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Light Rain, 68°F',
          bigsender: false
        },
        {
          id: 6,
          name: 'Iron Mountain Plumbing',
          website: 'https://www.ironmountainplumbing.com/',
          location: 'Pittsburgh, PA',
          weather_data: 'Sunny, 76°F',
          bigsender: false
        }
      ];
      
      setTestCompanies(companies);
      // REVIEW
      // setToastMessage('✅ Companies loaded successfully!');
    } catch (error) {
      // REVIEW
      setToastMessage(`❌ Error loading companies: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // --
  const generateMarketingPlan = async (company: Company | null): Promise<string> => {
    setLoading(true);
    setToastMessage('');
    try {
      if (!company) {
        throw new Error('No company selected');
      }

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable.');
      }

      // Generate marketing plan using the agent
      const prompt = `Generate a marketing plan for ${company.name}. ${input}`;
      const result = await run(dopeMarketingAgent, prompt);
      console.log('result', result);

      setToastMessage('Marketing plan generated');
      return result.finalOutput || 'No marketing plan generated';



    } catch (error) {
      const errorMessage = `❌ Error generating marketing plan: ${error instanceof Error ? error.message : String(error)}`;
      setToastMessage(errorMessage);
      return errorMessage;
    } finally {
      setLoading(false);
    }
  }

  const talkToAgent = async (message: string) => {
    const result = await run(dopeMarketingAgent, message);
    return result.finalOutput || 'No response from agent';
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <LLMContext.Provider value={{
      placeHolderMessage,
      selectedCompany,
      setSelectedCompany,
      testCompanies,
      setTestCompanies,
      loading,
      input,
      setInput,
      messages,
      setMessages,
      screenshotPath,
      setScreenshotPath,
      clearMessages,
      loadCompanies,
      generateMarketingPlan,
      talkToAgent,
      brandColors,
      setBrandColors,
      classifiedImages,
      setClassifiedImages,
      campaignElements,
      setCampaignElements
    }}>
      {children}
    </LLMContext.Provider>
  );
};

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error('useLLM must be used within a LLMProvider');
  }
  return context;
};

