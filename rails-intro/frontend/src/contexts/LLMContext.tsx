import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LLMContextType, Company } from '../types/llms';
import { Message } from '../components/ChatWindow';
import { useToastMessage } from './ToastMessageContext';
import { Agent, tool, run, setDefaultOpenAIKey, setDefaultOpenAIClient } from '@openai/agents';
import { setOpenAIAPI } from '@openai/agents';
import OpenAI from 'openai';

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
      const response = await fetch('/api/v1/companies');
      if (!response.ok) {
        console.log('response', response);
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      console.log('data', data);
      setTestCompanies(data);
    } catch (error) {
      setToastMessage(`❌ Error loading companies: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // --

  const marketingPlanTool = tool({
    name: 'generate_marketing_plan',
    description: 'Generate a comprehensive marketing plan for a company',
    parameters: {
      type: 'object',
      properties: {
        company_name: { type: 'string' },
      },
      required: ['company_name'],
      additionalProperties: false
    },
    strict: true,
    execute: async (input: any) => {
      const { company_name, industry, target_audience, budget } = input;
      return `Marketing Plan for ${company_name}:

**Industry:** ${industry || 'General'}
**Target Audience:** ${target_audience || 'General consumers'}
**Budget:** ${budget || 'Standard'}

## 1. Digital Marketing Strategy
- Social media campaigns across major platforms
- SEO optimization for better search visibility
- Email marketing campaigns
- Content marketing and blogging

## 2. Traditional Marketing
- Print advertising in relevant publications
- Local event sponsorships
- Community partnerships
- Direct mail campaigns

## 3. Performance Metrics
- Track engagement rates
- Monitor conversion rates
- Measure ROI on all campaigns
- Regular performance reviews

## 4. Timeline
- Month 1-2: Setup and initial campaigns
- Month 3-6: Optimization and scaling
- Month 7-12: Advanced strategies and expansion`;
    },
  });

  const dopeMarketingAgent = new Agent({
    name: 'Dope Marketing Agent',
    // description: 'A marketing agent that can generate a marketing plan for a company',
    instructions: 'You are a helpful assistant',
    tools: [marketingPlanTool]
  })

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
      clearMessages,
      loadCompanies,
      generateMarketingPlan
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

