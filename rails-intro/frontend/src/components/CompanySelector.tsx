import React, { useState } from 'react';
import { useLLM } from '../contexts/LLMContext';
import { Company } from '../types/llms';

const styles = {
  selectorContainer: {
    padding: '15px',
    background: 'white',
    borderRadius: '8px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#333',
    fontSize: '1rem',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '0.9rem',
    background: 'white',
    cursor: 'pointer',
  },
};

const CompanySelector: React.FC = () => {
  const { testCompanies, loading, setSelectedCompany, selectedCompany } = useLLM();
  const { setInput, input } = useLLM();

  const handleSelectCompany = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = parseInt(event.target.value, 10);
    const company = testCompanies.find(c => c.id === companyId) || null;
    setSelectedCompany(company);
    if (input) {
      setInput(prevInput => `${prevInput} We are working on ${company?.name} today. My website is ${company?.website}. Find our headquarters, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
    } else {
      setInput(`We are working on ${company?.name} today. My website is ${company?.website}. Find our headquarters, and give me the weather for the next 7 days in that area. We have some marketing initiatives that may be dependant on the weather so it is important. While you are at it since you are looking at our site, give us your best campaign strategy to get more customers in the next 8 weeks.`);
    }
  };

  if (loading) {
    return <div style={styles.selectorContainer}>Loading companies...</div>;
  }

  return (
    <div style={styles.selectorContainer}>
      <label htmlFor="company-selector" style={styles.label}>
        Select a Company
      </label>
      <select
        id="company-selector"
        onChange={handleSelectCompany}
        style={styles.select}
        defaultValue=""
        className="focus:outline-none focus:border-blue-500"
      >
        <option value="" disabled>-- Choose a company --</option>
        {testCompanies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} ({company.bigsender ? 'Big Sender' : 'Little Sender'})
          </option>
        ))}
      </select>
      
      {selectedCompany && (
        <div className="mt-4 p-2 bg-gray-50 rounded border gap-1 flex flex-col">
          
          <span className={`px-2 py-1 text-xs w-max text-white rounded-md ${selectedCompany.bigsender ? 'bg-red-500' : 'bg-orange-500'}`}>
            {selectedCompany.bigsender ? 'Big Sender' : 'Little Sender'}
          </span>

          <div>
            <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
            <p className="text-sm text-blue-600">
              <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                {selectedCompany.website}
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Location: {selectedCompany.location || 'N/A'}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default CompanySelector; 