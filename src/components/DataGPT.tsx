
import React, { useState, useCallback } from "react";
import axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HC_more from 'highcharts/highcharts-more';
import { 
  ChevronLeft, 
  Database, 
  BarChart, 
  Layers, 
  PieChart 
} from "lucide-react";

// Initialize Highcharts modules
HC_more(Highcharts);

type ChartType = "column" | "line" | "bar" | "area" | "pie";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const GEMINI_API = "http://127.0.0.1:8080/gemini";
  const BIGQUERY_API = "http://127.0.0.1:8080/api/bigquery";

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

      // Execute SQL query on BigQuery
      const bigQueryResponse = await axios.post(BIGQUERY_API, { query: generatedSQL });
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

    // Prepare options based on chart type
    let options: Highcharts.Options = {
      chart: { 
        type: chartType,
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
      colors: ['#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#F59E0B'],
      credits: {
        enabled: false
      }
    };

    // Special handling for different chart types
    switch (chartType) {
      case 'pie':
        options.series = [{
          type: 'pie',
          name: yAxis,
          data: xData.map((category, index) => ({
            name: category,
            y: Number(yData[index])
          }))
        }];
        // Remove x and y axes for pie chart
        options.xAxis = undefined;
        options.yAxis = undefined;
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

    return <HighchartsReact highcharts={Highcharts} options={options} />;
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
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Enter your query in plain English (e.g., Total sales by region)"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="p-4 pl-12 w-full border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
           
            <button 
              onClick={handleQuerySubmit} 
              disabled={isLoading}
              className="mt-4 w-full p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
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
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Query Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        {Object.keys(queryResults[0]).map((key) => (
                          <th key={key} className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value, idx) => (
                            <td key={idx} className="px-4 py-3 text-sm">
                              {value != null ? String(value) : "N/A"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Visualization</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
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
                    <div className="flex space-x-2">
                      {(['column', 'line', 'bar', 'area', 'pie'] as ChartType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`p-3 rounded-lg transition-all ${
                            chartType === type 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600 hover:bg-blue-50 border'
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
