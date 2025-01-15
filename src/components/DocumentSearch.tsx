
// //DocumentSearch.tsx
// import React, { useEffect } from 'react';
// import { FaArrowLeft } from 'react-icons/fa';

// interface DocumentSearchProps {
//   onBack: () => void;
// }

// const DocumentSearch: React.FC<DocumentSearchProps> = ({ onBack }) => {
//   useEffect(() => {
//     const script = document.createElement('script');
//     script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
//     script.async = true;
//     document.body.appendChild(script);

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-white p-4">
//       <button
//         onClick={onBack}
//         className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
//         title="Back to Demo Selection"
//       >
//         <FaArrowLeft className="w-5 h-5 text-gray-600" />
//       </button>

//       <div className="max-w-4xl mx-auto">
//         <gen-search-widget
//           configid="4e9e2b46-48e7-448b-89dc-f8f6d1c283cd"
//           triggerid="searchWidgetTrigger"
//         ></gen-search-widget>

//         <input 
//           placeholder="Search here" 
//           id="searchWidgetTrigger" 
//           className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>
//     </div>
//   );
// };

// export default DocumentSearch;

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from "lucide-react";

interface DocumentSearchProps {
  onBack: () => void;
}

interface GenSearchWidget extends HTMLElement {
  open: () => void;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeWidget = async () => {
      const script = document.createElement('script');
      script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
      script.async = true;

      const scriptLoaded = new Promise((resolve) => {
        script.onload = resolve;
      });

      document.body.appendChild(script);

      try {
        await scriptLoaded;
        await customElements.whenDefined('gen-search-widget');

        if (mounted) {
          setIsLoading(false);

          setTimeout(() => {
            const widget = document.querySelector('gen-search-widget');
            if (widget && 'open' in widget) {
              (widget as GenSearchWidget).open();
              setIsWidgetReady(true);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error initializing widget:', error);
        setIsLoading(false);
      }
    };

    initializeWidget();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Custom styles for the widget */}
      <style>
        {`
          gen-search-widget {
            height: 100%;
            display: block;
          }

          gen-search-widget::part(header) {
            padding-left: 48px !important;
          }

          gen-search-widget::part(dialog) {
            max-width: 100% !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }

          .widget-container {
            height: 100%;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }

          .widget-container.ready {
            opacity: 1;
          }
        `}
      </style>

      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
          aria-label="Back to Demo Selection"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <span className="text-gray-600">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        <div className={`widget-container ${isWidgetReady ? 'ready' : ''}`}>
          <gen-search-widget
            configid="4e9e2b46-48e7-448b-89dc-f8f6d1c283cd"
            triggerid="searchWidgetTrigger"
          ></gen-search-widget>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearch;