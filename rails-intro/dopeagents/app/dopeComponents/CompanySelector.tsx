'use client'

import React, { useState } from 'react';
import { useLLM } from '../contexts/LLMContext';
import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import AiInput from './AiInput';
import { usePostcard } from '../contexts/PostcardContext';
import { motion } from 'framer-motion';

const styles = {
  selectorContainer: {
    padding: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#d4d4d4',
    fontSize: '1rem',
  },
};

// Add CompanyInput component above the selector
export const CompanyInput: React.FC = () => {
  const { setSelectedCompany } = useLLM();
  const [url, setUrl] = useState('');

  // As user types, update selectedCompany in context
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setSelectedCompany({
      id: 99999, // Arbitrary id for custom
      name: value,
      website: value,
      bigsender: false,
    });
  };

  return (
    <input
      type="url"
      placeholder="https://yourcompany.com"
      value={url}
      onChange={handleChange}
      required
      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #333', marginBottom: 8, background: '#232323', color: '#fff' }}
    />
  );
};

const CompanySelector: React.FC = () => {
  const { testCompanies, loading, setSelectedCompany, selectedCompany } = useLLM();
  const { setInput, input } = useLLM();
  const { demoMode } = usePostcard();
  // Add handler for custom company input
  // const handleCustomCompany = (company: any) => {
  //   setSelectedCompany(company);
  //   if (input) {
  //     setInput(prevInput => `${prevInput} We are working on ${company?.name} today. My website is ${company?.website}. we are located in ${company?.location}, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
  //   } else {
  //     setInput(`We are working on ${company?.name} today. My website is ${company?.website}. we are located in ${company?.location}, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
  //   }
  // };

  // Toggle between demo and normal mode

  const handleSelectCompany = (value: string) => {
    const companyId = parseInt(value, 10);
    const company = testCompanies.find(c => c.id === companyId) || null;
    setSelectedCompany(company);
    if (input) {
      setInput(prevInput => `${prevInput} We are working on ${company?.name} today. My website is ${company?.website}. we are located in ${company?.location}, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
    } else {
      setInput(`We are working on ${company?.name} today. My website is ${company?.website}. we are located in ${company?.location}, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
    }
  };

  if (loading) {
    return <div style={styles.selectorContainer} className="text-neutral-400">Loading companies...</div>;
  }

  return (
    <div style={styles.selectorContainer}>
      {/* Render CompanyInput or selector based on mode */}
      {demoMode ? (
        <>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.618, ease: [0.23, 1.01, 0.32, 1] }}
          >
          <label htmlFor="company-selector" style={styles.label}>
            {selectedCompany ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#10b981" />
                Company Selected
              </span>
            ) : (
              'Select a Company'
            )}
          </label>
          <Select onValueChange={handleSelectCompany}>
            <SelectTrigger className="w-full bg-neutral-900 border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-600 hover:text-white focus:ring-neutral-600 focus:border-neutral-600 transition-all duration-200">
              <SelectValue placeholder="-- Choose a company --" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700">
              {testCompanies.map((company) => (
                <SelectItem 
                  key={company.id} 
                  value={company.id.toString()}
                  className="text-neutral-100 hover:bg-neutral-800 hover:text-white focus:bg-neutral-700 focus:text-white cursor-pointer transition-colors duration-150 data-[highlighted]:bg-neutral-800 data-[highlighted]:text-white"
                >
                  {company.name} ({company.bigsender ? 'Big Sender' : 'Little Sender'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompany && (
            <div className="mt-4 p-3 bg-neutral-900 border border-neutral-700 rounded gap-2 flex flex-col hover:bg-neutral-850 transition-colors duration-200" style={{backgroundColor: 'rgb(23 23 23)'}}>
              <span className={`px-2 py-1 text-xs w-max text-white rounded-md transition-colors duration-150 ${selectedCompany.bigsender ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
                {selectedCompany.bigsender ? 'Big Sender' : 'Little Sender'}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">{selectedCompany.name}</h3>
                <p className="text-sm text-neutral-300">
                  <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-100 underline transition-colors duration-150 hover:decoration-neutral-400">
                    {selectedCompany.website}
                  </a>
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Location: {selectedCompany.location || 'N/A'}
                </p>
              </div>
            </div>
          )}
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.618, ease: [0.23, 1.01, 0.32, 1] }}
        >
          <AiInput/>
        </motion.div>
        // <CompanyInput />
      )}
    </div>
  );
};

export default CompanySelector; 