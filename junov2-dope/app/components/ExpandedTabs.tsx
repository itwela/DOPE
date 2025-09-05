'use client'

import { useState } from "react";

interface ExpandedTabsProps {
  className?: string;
  onEmployeeProfilesClick?: () => void;
}

export default function ExpandedTabs({ className = "", onEmployeeProfilesClick }: ExpandedTabsProps) {
  const [activeTab, setActiveTab] = useState<'employee-profiles' | 'notifications' | 'settings' | 'help' | 'security' | null>(null);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'employee-profiles' && onEmployeeProfilesClick) {
      setActiveTab('employee-profiles');
      onEmployeeProfilesClick();
    } else {
      setActiveTab(tabId as 'employee-profiles' | 'notifications' | 'settings' | 'help' | 'security' | null);
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
        {/* Employee Profiles */}
        <button
          onClick={() => handleTabClick('employee-profiles')}
          className={`p-3 rounded-full transition-all duration-200 ${
            activeTab === 'employee-profiles'
              ? 'bg-accent text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
          title="Employee Profiles"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
