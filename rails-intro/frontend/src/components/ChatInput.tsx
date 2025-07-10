import React, { useState } from 'react';
import { useLLM } from '../contexts/LLMContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onGeneratePlan: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onGeneratePlan }) => {
  const { input, setInput, clearMessages } = useLLM();

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleGeneratePlan = () => {
    if (input.trim()) {
      onGeneratePlan(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line on Enter
      handleSend();
    }
  };

  return (
    <div className='h-max' style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' as const, width: '100%', gap: '10px' }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        style={{
          padding: '10px',
          borderRadius: '8px 0 0 8px',
          border: '1px solid #ccc',
          outline: 'none',
          resize: 'none',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          width: '100%'
        }}
        className='h-[150px]'
        placeholder="Type your message... (Shift + Enter for new line)"
        rows={2}
      />

      <div className='flex gap-2 w-full justify-between'>

        <div className='flex gap-2'>
          
          {/* NOTE -CLEAR */}
          <button
            onClick={clearMessages}
            style={{
              background: 'gray',
              color: 'white',
              border: 'none',
              borderRadius: '8px 8px 8px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              height: '40px' // Match the minimum height of textarea
            }}
          >
            <p className="text-xs">Clear</p>
          </button>

          {/* NOTE -GENERATE PLAN */}
          <button
            onClick={handleGeneratePlan}
            style={{
              background: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '8px 8px 8px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              height: '40px' // Match the minimum height of textarea
            }}
          >
            <p className="text-xs">Generate Plan</p>
          </button>

        </div>

        {/* NOTE -SEND */}
        <button
          onClick={handleSend}
          style={{
            background: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 8px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            height: '40px' // Match the minimum height of textarea
          }}
        >
          <p className="text-xs">Send</p>
        </button>

      </div>
    </div>
  );
};

export default ChatInput; 