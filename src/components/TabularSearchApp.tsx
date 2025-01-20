//TabularSearchApp.tsx
import React, { useEffect, useState } from 'react';
import Header from './Header';

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
              
              if (widget.shadowRoot) {
                const styleSheet = new CSSStyleSheet();
                styleSheet.replaceSync(`
                  div[role="dialog"] {
                    position: relative !important;
                    height: calc(100vh - 64px) !important;
                    margin-top: 0 !important;
                    top: 0 !important;
                    border-radius: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    display: flex !important;
                    flex-direction: column !important;
                  }
                  .content {
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                  }
                  .search-bar-container {
                    padding: 1rem !important;
                    background-color: #f9fafb !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    width: 100% !important;
                    display: flex !important;
                    justify-content: center !important;
                    flex-shrink: 0 !important;
                  }
                  ucs-search-bar {
                    width: 100% !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                  }
                  .main {
                    width: 100% !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                    padding: 0 1rem !important;
                  }
                  button[aria-label="Close"],
                  md-icon-button[data-aria-label="Close"],
                  [aria-label="Close"] {
                    display: none !important;
                  }
                  .backdrop {
                    display: none !important;
                  }
                  .conversation-and-results {
                    flex: 1 1 auto !important;
                    overflow-y: auto !important;
                    width: 100% !important;
                  }
                  .search-results-container {
                    padding: 1rem !important;
                    width: 100% !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                  }
                  ucs-results {
                    height: 100% !important;
                    overflow-y: auto !important;
                  }
                  .sticky {
                    position: sticky !important;
                    top: 0 !important;
                    background: #f9fafb !important;
                    z-index: 10 !important;
                  }
                `);
                widget.shadowRoot.adoptedStyleSheets = [styleSheet];
              }
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
      const script = document.querySelector('script[src*="gen-app-builder"]');
      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div className="w-full z-10 bg-white">
        <Header title="Tabular Search" onBack={onBack} />
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        <div className={`h-full ${isWidgetReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          <gen-search-widget
            configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
            triggerid="searchWidgetTrigger"
            className="block h-full"
          ></gen-search-widget>
        </div>
      </div>

      <style>{`
        gen-search-widget {
          display: block !important;
          height: 100% !important;
          position: relative !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default TabularSearchApp;



