// // SearchAppComponent.tsx
// import React from 'react';
// import { FaArrowLeft,  FaFileAlt } from 'react-icons/fa';
// import { TbDeviceTabletSearch } from "react-icons/tb";

// interface SearchAppComponentProps {
//   onBack: () => void;
// }

// const SearchAppComponent: React.FC<SearchAppComponentProps> = ({ onBack }) => {
//   return (
//     <div className="min-h-screen bg-white p-4">
//       <button
//         onClick={onBack}
//         className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
//         title="Back to Demo Selection"
//       >
//         <FaArrowLeft className="w-5 h-5 text-gray-600" />
//       </button>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div
//           className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
//           onClick={() => {
//             // Navigate to Tabular Search App
//           }}
//         >
//           <div className="flex flex-col items-center text-center space-y-4">
//             <div className="p-4 rounded-full bg-gray-50">
//               <TbDeviceTabletSearch  className="w-12 h-12 text-blue-500" />
//             </div>
//             <h2 className="text-xl font-semibold text-gray-800">Tabular Search App</h2>
//             <p className="text-gray-600">Search and explore data in tabular format</p>
//           </div>
//         </div>

//         <div
//           className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
//           onClick={() => {
//             // Navigate to Document Search App
//           }}
//         >
//           <div className="flex flex-col items-center text-center space-y-4">
//             <div className="p-4 rounded-full bg-gray-50">
//               <FaFileAlt className="w-12 h-12 text-blue-500" />
//             </div>
//             <h2 className="text-xl font-semibold text-gray-800">Document Search App</h2>
//             <p className="text-gray-600">Search and explore documents</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchAppComponent;


// SearchAppComponent.tsx
import React from 'react';
import { FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { TbDeviceTabletSearch } from "react-icons/tb";

interface SearchAppComponentProps {
  onBack: () => void;
  onSelectDemo: (demoId: 'tabular-search' | 'document-search') => void;
}

const SearchAppComponent: React.FC<SearchAppComponentProps> = ({ onBack, onSelectDemo }) => {
  return (
    <div className="min-h-screen bg-white p-4">
      <button
        onClick={onBack}
        className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
        title="Back to Demo Selection"
      >
        <FaArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
          onClick={() => {
            onSelectDemo('tabular-search');
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-gray-50">
              <TbDeviceTabletSearch className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Tabular Search App</h2>
            <p className="text-gray-600">Search and explore data in tabular format</p>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
          onClick={() => {
            onSelectDemo('document-search');
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-gray-50">
              <FaFileAlt className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Document Search App</h2>
            <p className="text-gray-600">Search and explore documents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAppComponent;