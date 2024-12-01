//App.tsx
import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import DataPlatrInterface from './components/DataPlatrInterface';
import DemoSelection from './components/DemoSelection';
import SearchAppComponent from './components/SearchAppComponent';
import TabularSearchApp from './components/TabularSearchApp';
import DocumentSearch from './components/DocumentSearch';
import DataGPT from './components/DataGPT'; // new component

type DemoId = 'search' | 'ai-conversation' | 'demo-3' | 'demo-4' | 'tabular-search' | 'document-search' | 'data-gpt';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoId | null>(null);

  const handleDemoSelect = (demoId: DemoId) => {
    setSelectedDemo(demoId);
  };

  // Login and demo selection logic 
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (!selectedDemo) {
    return <DemoSelection onSelectDemo={handleDemoSelect} />;
  }

  
  switch (selectedDemo) {
    case 'search':
      return <SearchAppComponent onBack={() => setSelectedDemo(null)} onSelectDemo={setSelectedDemo} />;
    case 'tabular-search':
      return <TabularSearchApp onBack={() => setSelectedDemo('search')} />;
    case 'document-search':
      return <DocumentSearch onBack={() => setSelectedDemo('search')} />;
    case 'ai-conversation':
      return <DataPlatrInterface onBack={() => setSelectedDemo(null)} />;
    case 'data-gpt':
      return <DataGPT onBack={() => setSelectedDemo(null)}/>;
    default:
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <button
              onClick={() => setSelectedDemo(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Return to Demo Selection
            </button>
          </div>
        </div>
      );
  }
}

export default App;