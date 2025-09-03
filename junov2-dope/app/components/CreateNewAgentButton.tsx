'use client';

export const CreateNewAgentButton = () => {

    const comingSoon = true;
  
    return (
      <>
        {comingSoon ? (
          <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Coming Soon</p>
              <p className="text-xs text-gray-500 mt-1">{"We're working on adding new agents soon!"}</p>
            </div>
          </div>
        ) : (
          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Create New Agent</p>
              <p className="text-xs text-gray-500 mt-1">Build a custom AI assistant</p>
            </div>
          </button>
        )}
      </>
    );
  };