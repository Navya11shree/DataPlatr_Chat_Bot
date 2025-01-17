//DocumentSearch.tsx
import React, { useEffect, useState } from 'react';

import Header from './Header';

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
      <Header title="Document Search" onBack={onBack} />
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
// import React, { useEffect, useState } from 'react';

// import Header from './Header';

// interface DocumentSearchProps {
//   onBack: () => void;
// }

// interface GenSearchWidget extends HTMLElement {
//   open: () => void;
// }

// const DocumentSearch: React.FC<DocumentSearchProps> = ({ onBack }) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isWidgetReady, setIsWidgetReady] = useState(false);

//   useEffect(() => {
//     let mounted = true;

//     const initializeWidget = async () => {
//       // Create iframe
//       const iframe = document.createElement('iframe');
//       iframe.style.width = '100%';
//       iframe.style.height = '100%';
//       iframe.style.border = 'none';
      
//       const container = document.getElementById('widget-container');
//       if (!container) return;
//       container.appendChild(iframe);

//       // Get iframe document
//       const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//       if (!iframeDoc) return;

//       // Write initial HTML to iframe
//       iframeDoc.open();
//       iframeDoc.write(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <script async src="https://cloud.google.com/ai/gen-app-builder/client?hl=en_US"></script>
//             <style>
//               body {
//                 margin: 0;
//                 padding: 0;
//                 height: 100vh;
//                 overflow: hidden;
//               }
//               gen-search-widget {
//                 height: 100%;
//                 display: block;
//               }
//               gen-search-widget::part(header) {
//                 padding-left: 48px !important;
//               }
//               gen-search-widget::part(dialog) {
//                 max-width: 100% !important;
//                 width: 100% !important;
//                 height: 100% !important;
//                 margin: 0 !important;
//                 border-radius: 0 !important;
//               }
//             </style>
//           </head>
//           <body>
//             <gen-search-widget
//               configid="4e9e2b46-48e7-448b-89dc-f8f6d1c283cd"
//               triggerid="searchWidgetTrigger"
//             ></gen-search-widget>
//           </body>
//         </html>
//       `);
//       iframeDoc.close();

//       // Wait for widget to be defined in iframe
//       try {
//         await new Promise((resolve) => {
//           const checkWidget = () => {
//             if (iframeDoc.querySelector('gen-search-widget')) {
//               resolve(true);
//             } else {
//               setTimeout(checkWidget, 100);
//             }
//           };
//           checkWidget();
//         });

//         if (mounted) {
//           setIsLoading(false);

//           setTimeout(() => {
//             const widget = iframeDoc.querySelector('gen-search-widget');
//             if (widget && 'open' in widget) {
//               (widget as GenSearchWidget).open();
//               setIsWidgetReady(true);
//             }
//           }, 100);
//         }
//       } catch (error) {
//         console.error('Error initializing widget:', error);
//         setIsLoading(false);
//       }
//     };

//     initializeWidget();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <div className="fixed inset-0 bg-white flex flex-col">
//       <div className="flex-none">
//         <Header title="Document Search" onBack={onBack} />
//       </div>
      
//       <div className="flex-1 relative overflow-hidden">
//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-white">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//           </div>
//         )}

//         <div 
//           id="widget-container"
//           className={`h-full ${isWidgetReady ? 'opacity-100' : 'opacity-0'}`}
//           style={{ transition: 'opacity 0.3s ease-in-out' }}
//         />
//       </div>
//     </div>
//   );
// };

// export default DocumentSearch;

