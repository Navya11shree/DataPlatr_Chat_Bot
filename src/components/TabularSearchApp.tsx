// TabularSearchApp.tsx
import React, { useEffect, useRef } from 'react';
import { FaArrowLeft } from "react-icons/fa";

interface TabularSearchAppProps {
  onBack: () => void;
}

const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {
  const widgetRef = useRef(null);

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

      <div ref={widgetRef}>
        <gen-search-widget
          configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
          triggerid="searchWidgetTrigger"
        ></gen-search-widget>
        <input
          placeholder="Search here..."
          id="searchWidgetTrigger"
          className="w-full max-w-xl px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default TabularSearchApp;