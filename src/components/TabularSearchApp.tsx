
// TabularSearchApp.tsx direct opening  search 
import React, { useEffect } from 'react';
import { FaArrowLeft } from "react-icons/fa";

interface TabularSearchAppProps {
  onBack: () => void;
}

interface GenSearchWidget extends HTMLElement {
  open: () => void;
}

const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {

  useEffect(() => {
    // Load the gen-app-builder script
    const script = document.createElement('script');
    script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
    script.async = true;
    document.body.appendChild(script);

    // Function to attempt opening the widget
    const attemptOpenWidget = () => {
      const widget = document.querySelector('gen-search-widget');
      if (widget && 'open' in widget) {
        (widget as GenSearchWidget).open();
      } 
    };

    // Wait for both script load and custom element definition
    script.onload = () => {
      // Wait for custom element to be defined
      if (customElements.get('gen-search-widget')) {
        attemptOpenWidget();
      } else {
        // Watch for when the custom element gets defined
        customElements.whenDefined('gen-search-widget').then(() => {
          attemptOpenWidget();
        });
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <button
        onClick={onBack}
        className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
      >
        <FaArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div>
        <gen-search-widget
          configid="e6a01d81-7e83-43f9-8fa9-1545b9275a6c"
          triggerid="searchWidgetTrigger"
        ></gen-search-widget>
      </div>
    </div>
  );
};

export default TabularSearchApp;







//tabularsearchapp.tsx 

// import React, { useEffect, useState } from 'react';
// import { FaArrowLeft } from "react-icons/fa";

// interface TabularSearchAppProps {
//   onBack: () => void;
// }

// interface GenSearchWidget extends HTMLElement {
//   open: () => void;
// }

// interface QueryResult {
//   [key: string]: any; // Define the schema for the query result
// }

// const TabularSearchApp: React.FC<TabularSearchAppProps> = ({ onBack }) => {
//   const [queryResults, setQueryResults] = useState<QueryResult[]>([]); // Result from the query
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     // Load the gen-app-builder script
//     const script = document.createElement('script');
//     script.src = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';
//     script.async = true;
//     document.body.appendChild(script);

//     const attemptOpenWidget = () => {
//       const widget = document.querySelector('gen-search-widget');
//       if (widget && 'open' in widget) {
//         (widget as GenSearchWidget).open();
//       }
//     };

//     script.onload = () => {
//       if (customElements.get('gen-search-widget')) {
//         attemptOpenWidget();
//       } else {
//         customElements.whenDefined('gen-search-widget').then(attemptOpenWidget);
//       }
//     };

//     // Fetch the query results
//     fetchQueryResults();

//     return () => {
//       if (script.parentNode) {
//         script.parentNode.removeChild(script);
//       }
//     };
//   }, []);

//   const fetchQueryResults = async () => {
//     setLoading(true);
//     try {
//       // Fetch query results (you need to replace the URL with your endpoint for fetching query data)
//       const response = await fetch('/api/query-results'); // Modify with your correct endpoint
//       const data = await response.json();
//       setQueryResults(data.results);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch query results');
//       console.error('Error fetching query results:', err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-white p-4">
//       <button
//         onClick={onBack}
//         className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
//       >
//         <FaArrowLeft className="w-5 h-5 text-gray-600" />
//       </button>

//       <div className="grid grid-cols-2 gap-4">
//         {/* Left side - Query Result Table */}
//         <div className="border rounded-lg p-4">
//           <h2 className="text-xl font-semibold mb-4">Query Results</h2>
          
//           {loading && (
//             <div className="flex justify-center items-center h-32">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//             </div>
//           )}

//           {error && (
//             <div className="text-red-500 p-4 text-center">
//               {error}
//             </div>
//           )}

//           {!loading && !error && queryResults.length > 0 && (
//             <div className="overflow-x-auto">
//               <table className="min-w-full border">
//                 <thead>
//                   <tr className="bg-gray-50">
//                     {/* Dynamically render the table headers based on query results keys */}
//                     {Object.keys(queryResults[0]).map((key) => (
//                       <th key={key} className="border p-2">{key}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {queryResults.map((result, index) => (
//                     <tr key={index}>
//                       {Object.values(result).map((value, i) => (
//                         <td key={i} className="border p-2">{value}</td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Right side - Gen AI Search */}
//         <div className="border rounded-lg p-4">
//           <h2 className="text-xl font-semibold mb-4">Search Assistant</h2>
//           <gen-search-widget
//             configid={process.env.REACT_APP_GENAI_SERVING_CONFIG_ID || "e6a01d81-7e83-43f9-8fa9-1545b9275a6c"}
//             triggerid="searchWidgetTrigger"
//           ></gen-search-widget>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TabularSearchApp;
