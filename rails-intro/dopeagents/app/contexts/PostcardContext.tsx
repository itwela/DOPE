'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PostcardCategory {
  id: string;
  name: string;
  description: string;
}

export interface PostcardContextType {
  categories: PostcardCategory[];
  selectedCategory: PostcardCategory | null;
  setSelectedCategory: (category: PostcardCategory | null) => void;
  postcardDimensions: {
    width: number;
    height: number;
  };
  demoMode: boolean;
  setDemoMode: (demoMode: boolean) => void;
}

const PostcardContext = createContext<PostcardContextType | null>(null);

interface PostcardProviderProps {
  children: ReactNode;
}

export const PostcardProvider: React.FC<PostcardProviderProps> = ({ children }) => {
  
  // Postcard categories from current-ticket.md
  const categories: PostcardCategory[] = [
    {
      id: 'initial',
      name: 'Initial',
      description: 'First impression postcard to introduce your business'
    },
    {
      id: 'follow_up',
      name: 'Follow Up',
      description: 'Follow-up communications to maintain contact'
    },
    {
      id: 'meet_the_team',
      name: 'Meet The Team',
      description: 'Introduce your team and build personal connections'
    },
    {
      id: 'neighborhood',
      name: 'We Are In Your Neighborhood',
      description: 'Local presence and community-focused messaging'
    },
    {
      id: 'avoid_pain',
      name: 'Avoid Pain',
      description: 'Focus on preventing problems and pain points'
    },
    {
      id: 'safety_peace_of_mind',
      name: 'Safety / Peace of Mind',
      description: 'Emphasize security, reliability, and trust'
    },
    {
      id: 'simple_offer',
      name: 'Simple Offer',
      description: 'Clear, straightforward value proposition'
    },
    {
      id: 'sale_deal',
      name: 'Sale / Deal',
      description: 'Special pricing and limited-time offers'
    },
    {
      id: 'discount',
      name: 'Discount',
      description: 'Money-saving opportunities and promotions'
    },
    {
      id: 'offer',
      name: 'Offer',
      description: 'General offers and incentives'
    },
    {
      id: 'comedy',
      name: 'Comedy',
      description: 'Humorous approach to engage customers'
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState<PostcardCategory | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  // Standard postcard dimensions (landscape orientation)
  const postcardDimensions = {
    width: 900,
    height: 600
  };

  return (
    <PostcardContext.Provider value={{
      categories,
      selectedCategory,
      setSelectedCategory,
      postcardDimensions,
      demoMode,
      setDemoMode
    }}>
      {children}
    </PostcardContext.Provider>
  );
};

export const usePostcard = () => {
  const context = useContext(PostcardContext);
  if (!context) {
    throw new Error('usePostcard must be used within a PostcardProvider');
  }
  return context;
}; 