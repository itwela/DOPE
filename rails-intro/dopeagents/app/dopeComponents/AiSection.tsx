'use client'

import React from 'react';
import { useLLM } from '../contexts/LLMContext';
import { useToastMessage } from '../contexts/ToastMessageContext';
import ChatWindow, { Message } from './ChatWindow';
import ChatInput from './ChatInput';
import { Company } from '../types/llms';

export default function AiSection() {
    const { generateMarketingPlan, talkToAgent, placeHolderMessage, messages, setMessages, selectedCompany } = useLLM();
    const { setToastMessage } = useToastMessage();

    // This is the handle key down press function in the ChatInput.
    // LINK rails-intro/frontend/src/components/ChatInput.tsx:19
    const handleSendMessage = async (message: string) => {
        const userMessage: Message = { text: message, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, userMessage]);

        // Placeholder for AI 'thinking' indicator
        setMessages(prevMessages => [...prevMessages, { text: "...", sender: 'ai' }]);

        // TODO: Here you would call your actual AI agent.
        // 
        const result = await talkToAgent(message);

        // console.log('result', result);

        setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1] = { text: result, sender: 'ai' };
            return newMessages;
        });


        // For now, let's just simulate an AI response after a delay.
        // setTimeout(() => {
        //     setMessages(prevMessages => {
        //         const newMessages = [...prevMessages];
        //         newMessages[newMessages.length - 1] = { text: placeHolderMessage, sender: 'ai' };
        //         return newMessages;
        //     });
        // }, 1000);

    };

    const handleGeneratePlan = async (message: string) => {
        const userMessage: Message = { text: message, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, userMessage]);

        // Placeholder for AI 'thinking' indicator
        setMessages(prevMessages => [...prevMessages, { text: "...", sender: 'ai' }]);

        // TODO: Here you would call your actual AI agent.
        // 
        const result = await generateMarketingPlan(selectedCompany as Company || null);

        // console.log('result', result);

        setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1] = { text: result, sender: 'ai' };
            return newMessages;
        });


        // For now, let's just simulate an AI response after a delay.
        // setTimeout(() => {
        //     setMessages(prevMessages => {
        //         const newMessages = [...prevMessages];
        //         newMessages[newMessages.length - 1] = { text: placeHolderMessage, sender: 'ai' };
        //         return newMessages;
        //     });
        // }, 1000);

        setToastMessage('AI response generated');
    };

    const styles = {
        aiSectionContainer: {
          padding: '15px',
          background: 'white',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column' as const,
          height: 'calc(100vh - 300px)',
          width: '100%',
          maxWidth: '800px',
          margin: '20px auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }
    };

    return (
        <div style={styles.aiSectionContainer}>
            <ChatWindow messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} onGeneratePlan={handleGeneratePlan} />
        </div>
    );
}