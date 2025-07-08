import React, { createContext, useContext, useState, ReactNode } from 'react';

type MessageContextType = {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  clearMessage: () => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');

  const clearMessage = () => setMessage('');

  return (
    <MessageContext.Provider value={{ message, setMessage, clearMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}; 