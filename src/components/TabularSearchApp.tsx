
// TabularSearchApp.tsx 
import React, { useEffect } from 'react';
import { FaArrowLeft } from "react-icons/fa";

interface TabularSearchAppProps {
  onBack: () => void;
}

interface GenSearchWidget extends HTMLElement {
  open: () => void;
}

const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {

  useEffect(() => {
    // Load the gen-app-builder script
    const script = document.createElement('script');
    script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
    script.async = true;
    document.body.appendChild(script);

    // Function to attempt opening the widget
    const attemptOpenWidget = () => {
      const widget = document.querySelector('gen-search-widget');
      if (widget && 'open' in widget) {
        (widget as GenSearchWidget).open();
      } 
    };

    // Wait for both script load and custom element definition
    script.onload = () => {
      // Wait for custom element to be defined
      if (customElements.get('gen-search-widget')) {
        attemptOpenWidget();
      } else {
        // Watch for when the custom element gets defined
        customElements.whenDefined('gen-search-widget').then(() => {
          attemptOpenWidget();
        });
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <button
        onClick={onBack}
        className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
      >
        <FaArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div>
        <gen-search-widget
          configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
          triggerid="searchWidgetTrigger"
        ></gen-search-widget>
      </div>
    </div>
  );
};

export default TabularSearchApp;
