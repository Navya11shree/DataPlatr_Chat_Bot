
//DocumentSearch.tsx
import React, { useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface DocumentSearchProps {
  onBack: () => void;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ onBack }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <button
        onClick={onBack}
        className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
        title="Back to Demo Selection"
      >
        <FaArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="max-w-4xl mx-auto">
        <gen-search-widget
          configid="4e9e2b46-48e7-448b-89dc-f8f6d1c283cd"
          triggerid="searchWidgetTrigger"
        ></gen-search-widget>

        <input 
          placeholder="Search here" 
          id="searchWidgetTrigger" 
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default DocumentSearch;