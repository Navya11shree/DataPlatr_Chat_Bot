// Header.tsx
import React from 'react';
import { ArrowLeft } from "lucide-react";

// Define the props interface for type safety
interface HeaderProps {
  title: string;      // The title to display in the header
  onBack: () => void; // Function to call when back button is clicked
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <div className="bg-white shadow-sm">
      {/* Max width container with padding */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Flex container for header items */}
        <div className="flex items-center space-x-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Company logo */}
          <img
            src="https://media.licdn.com/dms/image/v2/D560BAQGd9CNgsgxDGg/company-logo_200_200/company-logo_200_200/0/1727775506558/dataplatrinc_logo?e=1738800000&v=beta&t=M0FwxfZoe-YsswSG5cL9rbwznIxxm2Jbmf6_UFUdlXM"
            alt="Data Platr Logo"
            className="w-10 h-10"
          />

          {/* Header title */}
          <h1 className="text-2xl font-bold text-gray-800">
            Demo {title}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Header;