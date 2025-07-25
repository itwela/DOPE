'use client'

import React, { useEffect, useRef } from 'react';

export interface Message {
  text: string;
  sender: 'user' | 'ai';
}

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto" style={{ display: 'flex', flexDirection: 'column' as const }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        {/* <button 
          onClick={clearMessages}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear
        </button> */}
      </div>
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          border: '1px solid #ccc', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <div style={{ marginTop: 'auto' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', marginBottom: '10px' }}>
              <div style={{ 
                background: msg.sender === 'user' ? '#f2791d' : '#e9e9eb', 
                color: msg.sender === 'user' ? 'white' : 'black',
                padding: '8px 12px', 
                borderRadius: '18px',
                display: 'inline-block',
                maxWidth: '70%',
                wordWrap: 'break-word'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 