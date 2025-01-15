
// // TabularSearchApp.tsx 
// import React, { useEffect } from 'react';
// import { FaArrowLeft } from "react-icons/fa";

// interface TabularSearchAppProps {
//   onBack: () => void;
// }

// interface GenSearchWidget extends HTMLElement {
//   open: () => void;
// }

// const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {

//   useEffect(() => {
//     // Load the gen-app-builder script
//     const script = document.createElement('script');
//     script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
//     script.async = true;
//     document.body.appendChild(script);

//     // Function to attempt opening the widget
//     const attemptOpenWidget = () => {
//       const widget = document.querySelector('gen-search-widget');
//       if (widget && 'open' in widget) {
//         (widget as GenSearchWidget).open();
//       } 
//     };

//     // Wait for both script load and custom element definition
//     script.onload = () => {
//       // Wait for custom element to be defined
//       if (customElements.get('gen-search-widget')) {
//         attemptOpenWidget();
//       } else {
//         // Watch for when the custom element gets defined
//         customElements.whenDefined('gen-search-widget').then(() => {
//           attemptOpenWidget();
//         });
//       }
//     };

//     return () => {
//       if (script.parentNode) {
//         script.parentNode.removeChild(script);
//       }
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-white p-4">
//       <button
//         onClick={onBack}
//         className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
//       >
//         <FaArrowLeft className="w-5 h-5 text-gray-600" />
//       </button>

//       <div>
//         <gen-search-widget
//           configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
//           triggerid="searchWidgetTrigger"
//         ></gen-search-widget>
//       </div>
//     </div>
//   );
// };

// export default TabularSearchApp;
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from "lucide-react";

interface TabularSearchAppProps {
  onBack: () => void;
}

interface GenSearchWidget extends HTMLElement {
  open: () => void;
}

const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeWidget = async () => {
      // Create and load the script
      const script = document.createElement('script');
      script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
      script.async = true;
      
      // Promise to handle script loading
      const scriptLoaded = new Promise((resolve) => {
        script.onload = resolve;
      });
      
      document.body.appendChild(script);
      
      try {
        // Wait for script to load
        await scriptLoaded;
        
        // Wait for custom element to be defined
        await customElements.whenDefined('gen-search-widget');
        
        if (mounted) {
          setIsLoading(false);
          
          // Open widget after a brief delay to ensure proper initialization
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
      
      return () => {
        mounted = false;
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    initializeWidget();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 flex items-center gap-2"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <span className="text-gray-600">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        <div className={`h-full ${isWidgetReady ? 'opacity-100' : 'opacity-0'}`}>
          <gen-search-widget
            configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
            triggerid="searchWidgetTrigger"
          ></gen-search-widget>
        </div>
      </div>
    </div>
  );
};

export default TabularSearchApp;