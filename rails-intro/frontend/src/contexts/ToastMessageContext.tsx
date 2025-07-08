import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type ToastMessageContextType = {
  toastMessage: string;
  setToastMessage: React.Dispatch<React.SetStateAction<string>>;
  clearToastMessage: () => void;
};

const ToastMessageContext = createContext<ToastMessageContextType | undefined>(undefined);

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div 
      className='fixed bottom-4 right-4 z-50 max-w-md'
      style={{
        background: message.includes('❌') ? '#fee2e2' : '#dcfce7',
        color: message.includes('❌') ? '#991b1b' : '#166534',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {message}
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          opacity: 0.6,
          fontSize: '16px'
        }}
      >
        ✕
      </button>
    </div>
  );
};

export const ToastMessageProvider = ({ children }: { children: ReactNode }) => {
  const [toastMessage, setToastMessage] = useState('');

  const clearToastMessage = () => setToastMessage('');

  return (
    <ToastMessageContext.Provider value={{ toastMessage, setToastMessage, clearToastMessage }}>
      {children}
      {toastMessage && <Toast message={toastMessage} onClose={clearToastMessage} />}
    </ToastMessageContext.Provider>
  );
};

export const useToastMessage = () => {
  const context = useContext(ToastMessageContext);
  if (context === undefined) {
    throw new Error('useToastMessage must be used within a ToastMessageProvider');
  }
  return context;
}; 