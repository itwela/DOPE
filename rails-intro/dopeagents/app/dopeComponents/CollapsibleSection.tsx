'use client'

import React, { useState, ReactNode } from 'react';

// Inline styles for the CollapsibleSection component
const styles = {
  section: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e1e5e9',
    width: '100%',
    overflow: 'hidden', // Ensures content doesn't spill out during animation
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    cursor: 'pointer',
    background: '#f8f9fa',
    borderBottom: '1px solid #e1e5e9',
  },
  headerOpen: {
    borderBottom: '1px solid #e1e5e9',
  },
  headerClosed: {
    borderBottom: 'none',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  icon: {
    transition: 'transform 0.3s ease',
  },
  iconOpen: {
    transform: 'rotate(90deg)',
  },
  content: {
    padding: '15px',
    borderTop: '1px solid #e1e5e9',
  },
};

interface CollapsibleSectionProps {
  title: string;
  open?: boolean;
  children: ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, open = false, children }) => {
  const [isOpen, setIsOpen] = useState(open);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div style={styles.section}>
      <div
        style={{
          ...styles.header,
          ...(isOpen ? styles.headerOpen : styles.headerClosed),
        }}
        onClick={toggleOpen}
        className="hover:bg-gray-100"
      >
        <h2 style={styles.title}>{title}</h2>
        <span
          style={{
            ...styles.icon,
            ...(isOpen ? styles.iconOpen : {}),
          }}
        >
          ▶
        </span>
      </div>
      {isOpen && (
        <div style={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection; 