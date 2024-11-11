// App.tsx
import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import DataPlatrInterface from './DataPlatrInterface';
import DemoSelection from './DemoSelection';
import SearchComponent from './SearchComponent';

type DemoId = 'ai-search' | 'ai-conversation' | 'demo-3' | 'demo-4';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoId | null>(null);

  const handleDemoSelect = (demoId: DemoId) => {
    setSelectedDemo(demoId);
  };

  // Render login if not logged in
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Render demo selection if logged in but no demo selected
  if (!selectedDemo) {
    return <DemoSelection onSelectDemo={handleDemoSelect} />;
  }

  // Render the appropriate interface based on selected demo
  switch (selectedDemo) {
    case 'ai-conversation':
      return <DataPlatrInterface onBack={() => setSelectedDemo(null)} />;
      case 'ai-search':
        return <SearchComponent onBack={() => setSelectedDemo(null)} />;
    // Add other demo interfaces here as they are developed
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