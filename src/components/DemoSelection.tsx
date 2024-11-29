
// // DemoSelection.tsx
import React from 'react';
import { PiChatCircleTextFill, PiMagnifyingGlassFill } from "react-icons/pi";
import { BsFillGrid3X3GapFill } from "react-icons/bs";
import { FaRobot } from "react-icons/fa";

interface Demo {
  id: 'search' | 'ai-conversation' | 'demo-3' | 'demo-4' | 'data-gpt';
  title: string;
  icon: JSX.Element;
  description: string;
}

interface DemoSelectionProps {
  onSelectDemo: (demoId: Demo['id']) => void;
}

const DemoSelection: React.FC<DemoSelectionProps> = ({ onSelectDemo }) => {
  const demos: Demo[] = [
    {
      id: 'search',
      title: 'Search Apps',
      icon: <PiMagnifyingGlassFill className="w-12 h-12 text-blue-500" />,
      description: 'Intelligent search across your data sources'
    },
    {
      id: 'ai-conversation',
      title: 'AI Conversation',
      icon: <PiChatCircleTextFill className="w-12 h-12 text-green-500" />,
      description: 'Interactive data analysis through conversation'
    },
    {
      id: 'demo-3',
      title: 'Demo 3',
      icon: <BsFillGrid3X3GapFill className="w-12 h-12 text-orange-500" />,
      description: ''
    },
    {
      id: 'data-gpt', // Replace 'demo-4' with 'data-gpt'
      title: 'DataGPT',
      icon: <FaRobot className="w-12 h-12 text-purple-500" />,
      description: 'Natural language data querying'
    }
  ];

  const handleDemoSelect = (demoId: Demo['id']) => {
    onSelectDemo(demoId);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header remains the same */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <img
              src="https://media.licdn.com/dms/image/v2/D560BAQGd9CNgsgxDGg/company-logo_200_200/company-logo_200_200/0/1727775506558/dataplatrinc_logo?e=1738800000&v=beta&t=M0FwxfZoe-YsswSG5cL9rbwznIxxm2Jbmf6_UFUdlXM"
              alt="Data Platr Logo"
              className="w-10 h-10"
            />
            <h1 className="text-2xl font-bold text-gray-800">Demo Selection</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demos.map((demo) => (
            <div
              key={demo.id}
              onClick={() => handleDemoSelect(demo.id)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-gray-50">
                  {demo.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{demo.title}</h2>
                <p className="text-gray-600">{demo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoSelection;