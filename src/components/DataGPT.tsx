
// import React, { useState, useCallback, useRef } from "react";
// import axios from "axios";
// import Highcharts from "highcharts";
// import HighchartsReact from "highcharts-react-official";
// import HC_more from 'highcharts/highcharts-more';
// import HC_boost from 'highcharts/modules/boost';
// import HC_exporting from 'highcharts/modules/exporting';

// import {
//   ChevronLeft,
//   Database,
//   BarChart,
//   Layers,
//   PieChart,
//   Trash2,
//   Download,
//   Expand,
//   Shrink
// } from "lucide-react";

// // Initialize Highcharts modules
// HC_more(Highcharts);
// HC_boost(Highcharts);
// HC_exporting(Highcharts);

// type ChartType = "column" | "line" | "bar" | "area" | "pie" | "scatter" | "doughnut" | "waterfall" | "stacked-bar";

// interface DataGPTProps {
//   onBack: () => void;
// }

// const DataGPT: React.FC<DataGPTProps> = ({ onBack }) => {
//   const [userQuery, setUserQuery] = useState<string>("");
//   const [sqlQuery, setSqlQuery] = useState<string>("");
//   const [queryResults, setQueryResults] = useState<any[]>([]);
//   const [xAxis, setXAxis] = useState<string>("");
//   const [yAxis, setYAxis] = useState<string>("");
//   const [chartType, setChartType] = useState<ChartType>("column");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

//   // Ref for the Highcharts component
//   const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

//   const GEMINI_API = "http://127.0.0.1:8080/gemini";
//   const BIGQUERY_API = "http://127.0.0.1:8080/api/bigquery";

//   // New clear function to reset all states
//   const handleClearQuery = () => {
//     setUserQuery("");
//     setSqlQuery("");
//     setQueryResults([]);
//     setXAxis("");
//     setYAxis("");
//     setChartType("column");
//     setIsLoading(false);
//     setError(null);
//   };

//   // New function to download chart as PNG
//   const handleDownloadChart = () => {
//     if (chartComponentRef.current) {
//       const chart = chartComponentRef.current.chart;
      
//       // Get SVG of the chart
//       const svg = chart.getSVG();
      
//       // Create a canvas to convert SVG to PNG
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');
//       const img = new Image();
      
//       img.onload = () => {
//         // Set canvas size to match image
//         canvas.width = img.width;
//         canvas.height = img.height;
        
//         // Draw image on canvas
//         ctx?.drawImage(img, 0, 0);
        
//         // Convert to PNG and trigger download
//         const link = document.createElement('a');
//         link.download = `${chartType}_chart_${xAxis}_vs_${yAxis}.png`;
//         link.href = canvas.toDataURL('image/png');
//         link.click();

//         // Clean up
//         URL.revokeObjectURL(img.src);
//       };
      
//       // Create blob URL for SVG
//       const blob = new Blob([svg], {type: 'image/svg+xml'});
//       img.src = URL.createObjectURL(blob);
//     }
//   };
//   // New function to toggle fullscreen
//   const handleToggleFullScreen = () => {
//     setIsFullScreen(!isFullScreen);
//   };

//   const handleQuerySubmit = useCallback(async () => {
//     if (!userQuery.trim()) {
//       setError("Please enter a meaningful query.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       // Call Gemini API
//       const geminiResponse = await axios.post(GEMINI_API, {
//         prompt: `Convert this to SQL: ${userQuery} for the table 'dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails'`,
//       });
//       const generatedSQL = geminiResponse.data.sql;
//       setSqlQuery(generatedSQL);

//       // Execute SQL query on BigQuery
//       const bigQueryResponse = await axios.post(BIGQUERY_API, { query: generatedSQL });
//       const results = bigQueryResponse.data.results;
//       setQueryResults(results);

//       if (results.length > 0) {
//         setXAxis(Object.keys(results[0])[0]);
//         setYAxis(Object.keys(results[0])[1]);
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setError("An error occurred while processing your query.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userQuery]);

//   const renderChart = () => {
//     if (!queryResults.length || !xAxis || !yAxis) {
//       return <p className="text-gray-500 text-center">No data to visualize</p>;
//     }

//     // Extract data for X and Y axes
//     const xData = queryResults.map((row) => row[xAxis] ?? "N/A");
//     const yData = queryResults.map((row) => row[yAxis] ?? 0);

//     // Prepare options based on chart type
//     let options: Highcharts.Options = {
//       chart: {
//         type: chartType === 'doughnut' ? 'pie' :
//           chartType === 'stacked-bar' ? 'bar' :
//             chartType === 'waterfall' ? 'waterfall' :
//               chartType,
//         style: {
//           fontFamily: 'Inter, sans-serif'
//         }
//       },
//       title: {
//         text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart of ${yAxis} vs ${xAxis}`,
//         style: {
//           color: '#333',
//           fontWeight: 'bold'
//         }
//       },
//       xAxis: {
//         categories: xData,
//         title: { text: xAxis },
//         labels: {
//           style: {
//             color: '#666'
//           }
//         }
//       },
//       yAxis: {
//         title: { text: yAxis },
//         labels: {
//           style: {
//             color: '#666'
//           }
//         }
//       },
//       series: [],
//       plotOptions: {
//         pie: {
//           innerSize: chartType === 'doughnut' ? '50%' : 0
//         },
//         bar: {
//           stacking: chartType === 'stacked-bar' ? 'normal' : undefined
//         }
//       },
//       colors: ['#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#F59E0B'],
//       credits: {
//         enabled: false
//       },
//       // Simplified exporting configuration
//       exporting: {
//         enabled: false,

//       }
//     };

//     // Special handling for different chart types
//     switch (chartType) {
//       case 'pie':
//       case 'doughnut':
//         options.series = [{
//           type: 'pie',
//           name: yAxis,
//           data: xData.map((category, index) => ({
//             name: category,
//             y: Number(yData[index])
//           }))
//         }];
//         // Remove x and y axes for pie/doughnut chart
//         options.xAxis = undefined;
//         options.yAxis = undefined;
//         break;

//       case 'scatter':
//         options.series = [{
//           type: 'scatter',
//           name: yAxis,
//           data: xData.map((x, index) => [Number(x), Number(yData[index])])
//         }];
//         options.xAxis = {
//           title: { text: xAxis }
//         };
//         options.yAxis = {
//           title: { text: yAxis }
//         };
//         break;

//       case 'waterfall':
//         options.series = [{
//           type: 'waterfall',
//           name: yAxis,
//           data: xData.map((category, index) => ({
//             name: category,
//             y: Number(yData[index])
//           }))
//         }];
//         break;

//       case 'stacked-bar':
//         options.series = [{
//           type: 'bar',
//           name: yAxis,
//           data: yData.map(Number)
//         }];
//         break;

//       case 'line':
//       case 'column':
//       case 'bar':
//       case 'area':
//       default:
//         options.series = [{
//           type: chartType,
//           name: yAxis,
//           data: yData.map(Number)
//         }];
//         break;
//     }

//     return (
//       <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white p-8' : ''}`}>
//         <div className={`${isFullScreen ? 'max-w-full h-full' : ''}`}>
//           <div className="flex justify-end space-x-2 mb-2">
//             <button
//               onClick={handleDownloadChart}
//               className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center"
//               title="Download Chart"
//             >
//               <Download className="mr-2" /> PNG
//             </button>
//             <button
//               onClick={handleToggleFullScreen}
//               className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center"
//               title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
//             >
//               {isFullScreen ? <Shrink className="mr-2" /> : <Expand className="mr-2" />}
//               {isFullScreen ? "Exit" : "Full"}
//             </button>
//           </div>
//           <HighchartsReact
//             highcharts={Highcharts}
//             options={options}
//             ref={chartComponentRef}
//           />
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center">
//           <button
//             onClick={onBack}
//             className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all mr-4"
//           >
//             <ChevronLeft className="text-white" />
//           </button>
//           <h1 className="text-2xl font-bold text-white flex items-center">
//             <Database className="mr-3" /> DataGPT - AI-powered SQL Insights
//           </h1>
//         </div>

//         <div className="p-8">
//           <div className="mb-6 relative flex items-center space-x-2">
//             <div className="flex-grow relative">
//               <input
//                 type="text"
//                 placeholder="Enter your query in plain English (e.g., Total sales by region)"
//                 value={userQuery}
//                 onChange={(e) => setUserQuery(e.target.value)}
//                 className="p-4 pl-12 w-full border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//               />
//             </div>

//             {/* Modern Clear Button */}
//             <button
//               onClick={handleClearQuery}
//               className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all group flex items-center justify-center"
//               title="Clear Query"
//             >
//               <Trash2
//                 className="w-6 h-6 group-hover:scale-110 transition-transform"
//                 strokeWidth={1.5}
//               />
//             </button>

//             <button
//               onClick={handleQuerySubmit}
//               disabled={isLoading}
//               className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
//             >
//               {isLoading ? (
//                 <span className="animate-pulse">Processing...</span>
//               ) : (
//                 <>Submit Query</>
//               )}
//             </button>
//           </div>

//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
//               {error}
//             </div>
//           )}

//           {sqlQuery && (
//             <div className="bg-gray-100 rounded-xl p-6 mb-6">
//               <h3 className="text-lg font-semibold mb-2 text-gray-700">Generated SQL Query:</h3>
//               <pre className="bg-white p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
//                 {sqlQuery}
//               </pre>
//             </div>
//           )}

//           {queryResults.length > 0 && (
//             <>
//               <div className="bg-gray-100 rounded-xl p-6 mb-6">
//                 <h3 className="text-lg font-semibold mb-4 text-gray-700">Query Results</h3>
//                 <div className="overflow-x-auto">
//                   <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
//                     <thead className="bg-gray-200">
//                       <tr>
//                         {Object.keys(queryResults[0]).map((key) => (
//                           <th key={key} className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             {key}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {queryResults.map((row, index) => (
//                         <tr key={index} className="hover:bg-gray-50 transition-colors">
//                           {Object.values(row).map((value, idx) => (
//                             <td key={idx} className="px-4 py-3 text-sm">
//                               {value != null ? String(value) : "N/A"}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <div className="bg-gray-100 rounded-xl p-6">
//                 <h3 className="text-lg font-semibold mb-4 text-gray-700">Visualization</h3>
//                 <div className="grid md:grid-cols-3 gap-4 mb-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">X-axis</label>
//                     <select
//                       value={xAxis}
//                       onChange={(e) => setXAxis(e.target.value)}
//                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     >
//                       {Object.keys(queryResults[0]).map((key) => (
//                         <option key={key} value={key}>{key}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Y-axis</label>
//                     <select
//                       value={yAxis}
//                       onChange={(e) => setYAxis(e.target.value)}
//                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     >
//                       {Object.keys(queryResults[0]).map((key) => (
//                         <option key={key} value={key}>{key}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
//                     <div className="flex flex-wrap space-x-2">
//                       {(['column', 'line', 'bar', 'area', 'pie', 'scatter', 'doughnut', 'waterfall', 'stacked-bar'] as ChartType[]).map((type) => (
//                         <button
//                           key={type}
//                           onClick={() => setChartType(type)}
//                           className={`p-3 rounded-lg transition-all mb-2 ${chartType === type
//                               ? 'bg-blue-600 text-white'
//                               : 'bg-white text-gray-600 hover:bg-blue-50 border'
//                             }`}
//                         >
//                           {type === 'column' && <BarChart className="inline-block mr-2" />}
//                           {type === 'line' && <Layers className="inline-block mr-2" />}
//                           {type === 'bar' && <BarChart className="inline-block mr-2" />}
//                           {type === 'area' && <Layers className="inline-block mr-2" />}
//                           {type === 'pie' && <PieChart className="inline-block mr-2" />}
//                           {type.charAt(0).toUpperCase() + type.slice(1)}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white rounded-xl p-4 shadow-sm">
//                   {renderChart()}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };


// export default DataGPT;


import React, { useState, useCallback, useRef } from "react";
import axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HC_more from 'highcharts/highcharts-more';
import HC_boost from 'highcharts/modules/boost';
import HC_exporting from 'highcharts/modules/exporting';

import {
  ChevronLeft,
  Database,
  BarChart,
  Layers,
  PieChart,
  Trash2,
  Download,
  Expand,
  Shrink,
  Sparkles 
  
} from "lucide-react";

// Initialize Highcharts modules
HC_more(Highcharts);
HC_boost(Highcharts);
HC_exporting(Highcharts);

type ChartType = "column" | "line" | "bar" | "area" | "pie" | "scatter" | "doughnut" | "waterfall" | "stacked-bar";

interface DataGPTProps {
  onBack: () => void;
}

const DataGPT: React.FC<DataGPTProps> = ({ onBack }) => {
  const [userQuery, setUserQuery] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [chartType, setChartType] = useState<ChartType>("column");
  const [recommendedChartType, setRecommendedChartType] = useState<ChartType | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Ref for the Highcharts component
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  const GEMINI_API = "http://127.0.0.1:8080/gemini";
  const BIGQUERY_API = "http://127.0.0.1:8080/api/bigquery";

  // clear function to reset all states
  const handleClearQuery = () => {
    setUserQuery("");
    setSqlQuery("");
    setQueryResults([]);
    setXAxis("");
    setYAxis("");
    setChartType("column");
    setRecommendedChartType(null);
    setRecommendationReason("");
    setIsLoading(false);
    setError(null);
  };

  // Convert Gemini's chart recommendation to our chart types
  const mapRecommendedChartType = (chart: string | null): ChartType => {
    const chartTypeMap: { [key: string]: ChartType } = {
      'bar': 'bar',
      'line': 'line',
      'scatter': 'scatter',
      'pie': 'pie'
    };
    return chart && chartTypeMap[chart] ? chartTypeMap[chart] : 'column';
  };

  // function to download chart as PNG
  const handleDownloadChart = () => {
    if (chartComponentRef.current) {
      const chart = chartComponentRef.current.chart;
      
      // Get SVG of the chart
      const svg = chart.getSVG();
      
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx?.drawImage(img, 0, 0);
        
        // Convert to PNG and trigger download
        const link = document.createElement('a');
        link.download = `${chartType}_chart_${xAxis}_vs_${yAxis}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Clean up
        URL.revokeObjectURL(img.src);
      };
      
      // Create blob URL for SVG
      const blob = new Blob([svg], {type: 'image/svg+xml'});
      img.src = URL.createObjectURL(blob);
    }
  };

  // function to toggle fullscreen
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleQuerySubmit = useCallback(async () => {
    if (!userQuery.trim()) {
      setError("Please enter a meaningful query.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call Gemini API
      const geminiResponse = await axios.post(GEMINI_API, {
        prompt: `Convert this to SQL: ${userQuery} for the table 'dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails'`,
      });
      
      const generatedSQL = geminiResponse.data.sql;
      setSqlQuery(generatedSQL);

      // Handle chart recommendation
      const recommendedChart = geminiResponse.data.recommended_chart;
      const recommendationText = geminiResponse.data.visualization_reason;
      
      if (recommendedChart) {
        const mappedChartType = mapRecommendedChartType(recommendedChart);
        setRecommendedChartType(mappedChartType);
        setChartType(mappedChartType);
        setRecommendationReason(recommendationText);
      }

      // Execute SQL query on BigQuery
      const bigQueryResponse = await axios.post(BIGQUERY_API, { 
        query: generatedSQL,
        recommended_chart: recommendedChart
      });
      const results = bigQueryResponse.data.results;
      setQueryResults(results);

      if (results.length > 0) {
        setXAxis(Object.keys(results[0])[0]);
        setYAxis(Object.keys(results[0])[1]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while processing your query.");
    } finally {
      setIsLoading(false);
    }
  }, [userQuery]);

    const renderChart = () => {
    if (!queryResults.length || !xAxis || !yAxis) {
      return <p className="text-gray-500 text-center">No data to visualize</p>;
    }

    // Extract data for X and Y axes
    const xData = queryResults.map((row) => row[xAxis] ?? "N/A");
    const yData = queryResults.map((row) => row[yAxis] ?? 0);

    //  options based on chart type
    let options: Highcharts.Options = {
      chart: {
        type: chartType === 'doughnut' ? 'pie' :
          chartType === 'stacked-bar' ? 'bar' :
            chartType === 'waterfall' ? 'waterfall' :
              chartType,
        style: {
          fontFamily: 'Inter, sans-serif'
        }
      },
      title: {
        text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart of ${yAxis} vs ${xAxis}`,
        style: {
          color: '#333',
          fontWeight: 'bold'
        }
      },
      xAxis: {
        categories: xData,
        title: { text: xAxis },
        labels: {
          style: {
            color: '#666'
          }
        }
      },
      yAxis: {
        title: { text: yAxis },
        labels: {
          style: {
            color: '#666'
          }
        }
      },
      series: [],
      plotOptions: {
        pie: {
          innerSize: chartType === 'doughnut' ? '50%' : 0
        },
        bar: {
          stacking: chartType === 'stacked-bar' ? 'normal' : undefined
        }
      },
      colors: ['#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#F59E0B'],
      credits: {
        enabled: false
      },
     
      exporting: {
        enabled: false,

      }
    };

    // different chart types
    switch (chartType) {
      case 'pie':
      case 'doughnut':
        options.series = [{
          type: 'pie',
          name: yAxis,
          data: xData.map((category, index) => ({
            name: category,
            y: Number(yData[index])
          }))
        }];
        // Remove x and y axes for pie/doughnut chart
        options.xAxis = undefined;
        options.yAxis = undefined;
        break;

      case 'scatter':
        options.series = [{
          type: 'scatter',
          name: yAxis,
          data: xData.map((x, index) => [Number(x), Number(yData[index])])
        }];
        options.xAxis = {
          title: { text: xAxis }
        };
        options.yAxis = {
          title: { text: yAxis }
        };
        break;

      case 'waterfall':
        options.series = [{
          type: 'waterfall',
          name: yAxis,
          data: xData.map((category, index) => ({
            name: category,
            y: Number(yData[index])
          }))
        }];
        break;

      case 'stacked-bar':
        options.series = [{
          type: 'bar',
          name: yAxis,
          data: yData.map(Number)
        }];
        break;

      case 'line':
      case 'column':
      case 'bar':
      case 'area':
      default:
        options.series = [{
          type: chartType,
          name: yAxis,
          data: yData.map(Number)
        }];
        break;
    }

    return (
      <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white p-8' : ''}`}>
        <div className={`${isFullScreen ? 'max-w-full h-full' : ''}`}>
          <div className="flex justify-end space-x-2 mb-2">
            <button
              onClick={handleDownloadChart}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center"
              title="Download Chart"
            >
              <Download className="mr-2" /> PNG
            </button>
            <button
              onClick={handleToggleFullScreen}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? <Shrink className="mr-2" /> : <Expand className="mr-2" />}
              {isFullScreen ? "Exit" : "Full"}
            </button>
          </div>
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            ref={chartComponentRef}
          />
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all mr-4"
          >
            <ChevronLeft className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Database className="mr-3" /> DataGPT - AI-powered SQL Insights
          </h1>
        </div>

        <div className="p-8">
          <div className="mb-6 relative flex items-center space-x-2">
            {/* query input section  */}
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Enter your query in plain English (e.g., Total sales by region)"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="p-4 pl-12 w-full border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={handleClearQuery}
              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all group flex items-center justify-center"
              title="Clear Query"
            >
              <Trash2
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                strokeWidth={1.5}
              />
            </button>

            <button
              onClick={handleQuerySubmit}
              disabled={isLoading}
              className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>Submit Query</>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {sqlQuery && (
            <div className="bg-gray-100 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Generated SQL Query:</h3>
              <pre className="bg-white p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
                {sqlQuery}
              </pre>
            </div>
          )}

          {queryResults.length > 0 && (
            <>
              {/* query results table*/}
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Query Results</h3>
                {/*  table rendering code */}
              </div>

              <div className="bg-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Visualization</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/*  axis and chart type selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">X-axis</label>
                    <select
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(queryResults[0]).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Y-axis</label>
                    <select
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(queryResults[0]).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                    <div className="flex flex-wrap space-x-2">
                      {(['column', 'line', 'bar', 'area', 'pie', 'scatter', 'doughnut', 'waterfall', 'stacked-bar'] as ChartType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`p-3 rounded-lg transition-all mb-2 ${
                            chartType === type
                              ? 'bg-blue-600 text-white'
                              : `bg-white text-gray-600 hover:bg-blue-50 border ${
                                  recommendedChartType === type ? 'ring-2 ring-green-500' : ''
                                }`
                          }`}
                        >
                          {type === 'column' && <BarChart className="inline-block mr-2" />}
                          {type === 'line' && <Layers className="inline-block mr-2" />}
                          {type === 'bar' && <BarChart className="inline-block mr-2" />}
                          {type === 'area' && <Layers className="inline-block mr-2" />}
                          {type === 'pie' && <PieChart className="inline-block mr-2" />}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {recommendedChartType && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4 text-blue-800 flex items-center">
                    <Sparkles className="mr-3 text-blue-600" />
                    <div>
                      <p className="font-semibold">AI Recommended Chart: {recommendedChartType.charAt(0).toUpperCase() + recommendedChartType.slice(1)}</p>
                      <p className="text-sm text-blue-700">{recommendationReason}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  {renderChart()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataGPT;