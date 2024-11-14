// // App.tsx
// import React, { useState } from 'react';
// import './App.css';
// import Login from './components/Login';
// import DataPlatrInterface from './components/DataPlatrInterface';
// import DemoSelection from './components/DemoSelection';
// import SearchAppComponent from './components/SearchAppComponent';
// import TabularSearchApp from './components/TabularSearchApp';
// import DocumentSearch from './components/DocumentSearch';

// type DemoId = 'search' | 'ai-conversation' | 'demo-3' | 'demo-4' | 'tabular-search' | 'document-search';

// function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
//   const [selectedDemo, setSelectedDemo] = useState<DemoId | null>(null);

//   const handleDemoSelect = (demoId: DemoId) => {
//     setSelectedDemo(demoId);
//   };

//   // Render login if not logged in
//   if (!isLoggedIn) {
//     return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
//   }

//   // Render demo selection if logged in but no demo selected
//   if (!selectedDemo) {
//     return <DemoSelection onSelectDemo={handleDemoSelect} />;
//   }

//   // Render the appropriate interface based on selected demo

// switch (selectedDemo) {
//   case 'search':
//     return <SearchAppComponent onBack={() => setSelectedDemo(null)} onSelectDemo={setSelectedDemo} />;
//   case 'tabular-search':
//     return <TabularSearchApp onBack={() => setSelectedDemo('search')} />;
//   case 'document-search':
//     return <DocumentSearch onBack={() => setSelectedDemo('search')} />;
//   case 'ai-conversation':
//     return <DataPlatrInterface onBack={() => setSelectedDemo(null)} />;
//   default:
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="bg-white p-8 rounded-lg shadow-md">
//           <button
//             onClick={() => setSelectedDemo(null)}
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             Return to Demo Selection
//           </button>
//         </div>
//       </div>
//     );
//   }
// }

// export default App;


import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import DataPlatrInterface from './components/DataPlatrInterface';
import DemoSelection from './components/DemoSelection';
import SearchAppComponent from './components/SearchAppComponent';
import TabularSearchApp from './components/TabularSearchApp';
import DocumentSearch from './components/DocumentSearch';
import GcpComponent from './components/GcpComponent'; // Assuming this is the GCP component

type DemoId = 'search' | 'ai-conversation' | 'demo-3' | 'demo-4' | 'tabular-search' | 'document-search';

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
    case 'search':
      return <SearchAppComponent onBack={() => setSelectedDemo(null)} onSelectDemo={setSelectedDemo} />;
    
    case 'tabular-search':
      // Render TabularSearchApp on the left and GCP Component on the right side by side
      return (
        <div className="flex min-h-screen">
          {/* Left side: TabularSearchApp */}
          <div className="w-1/2 p-4 bg-gray-100">
            <TabularSearchApp onBack={() => setSelectedDemo('search')} />
          </div>

          {/* Right side: GCP Component */}
          <div className="w-1/2 p-4 bg-white border-l">
            <GcpComponent />
          </div>
        </div>
      );

    case 'document-search':
      return <DocumentSearch onBack={() => setSelectedDemo('search')} />;

    case 'ai-conversation':
      return <DataPlatrInterface onBack={() => setSelectedDemo(null)} />;

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
