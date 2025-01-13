
//DataGPT.Tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import DataConnectionSidebar from './DataConnectionSidebar'; // Import the sidebar component
import {
  Expand,
  Shrink,
  Search,
  ArrowLeft,
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  ColumnsIcon,
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react';

// Color palettes
const COLOR_PALETTES = {
  default: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'],
  pastel: ['#FFD1DC', '#FFEBCD', '#E6E6FA', '#98FB98', '#87CEFA'],
  earth: ['#8B4513', '#A0522D', '#DEB887', '#D2691E', '#CD853F'],
  ocean: ['#1E90FF', '#00CED1', '#20B2AA', '#4682B4', '#5F9EA0'],
  sunset: ['#FF4500', '#FF6347', '#FF7F50', '#FF8C00', '#FFA500'],
} as const;

type ColorPaletteKey = keyof typeof COLOR_PALETTES;

// Types
interface RowData {
  [key: string]: string | number | boolean | null;
}

interface QueryResult {
  data: RowData[];
  columns: string[];
  chart_type?: string;
  llm_recommendation?: string;
  query_description?: string;
  table_reference?: string;
}

interface DataGPTProps {
  onBack?: () => void;
}

// New interface for chat history item
interface ChatHistoryItem {
  id: string;
  timestamp: Date;
  query: string;
  result: QueryResult;
  chartType?: string;
}

// Chart type icons mapping with labels
const CHART_TYPES = [
  { type: 'column', label: 'Column Chart', Icon: ColumnsIcon },
  { type: 'line', label: 'Line Chart', Icon: LineChart },
  { type: 'pie', label: 'Pie Chart', Icon: PieChart },
  { type: 'bar', label: 'Bar Chart', Icon: BarChart },
  { type: 'area', label: 'Area Chart', Icon: AreaChart }
];

const DataGPT: React.FC<DataGPTProps> = ({ onBack }) => {
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPaletteKey>('default');

  // State for connection details
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');

  // New state for chat history
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Refs for scrolling
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  // Refs for chart
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  // Scroll to bottom of chat history when new result is added
  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, queryResult]);

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSubmit = async () => {
    // Clear previous errors and results
    setError(null);

    // Condensed validation
    const validationErrors = ['Connection', 'Dataset', 'Table', 'Query'].filter(field => {
      const value = { 'Connection': selectedConnection, 'Dataset': selectedDataset, 'Table': selectedTable, 'Query': query.trim() }[field];
      return !value;
    }).map(field => `Please select a ${field.toLowerCase()}`);

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [project_id, dataset_name] = selectedDataset.split('.');

      // Gemini endpoint request
      const geminiResponse = await axios.post('http://127.0.0.1:8080/gemini', {
        query,
        table_name: `${project_id}.${dataset_name}.${selectedTable}`,
        project_id,
        dataset_id: dataset_name,
        table_id: selectedTable
      });

      // Check for error in Gemini response
      if (geminiResponse.data.error) {
        setError(geminiResponse.data.message);
        setIsLoading(false);
        return;
      }

      const generatedSqlQuery = geminiResponse.data.sql_query;
      const queryDescription = geminiResponse.data.query_description;

      // BigQuery endpoint request
      const bigqueryResponse = await axios.post('http://127.0.0.1:8080/api/bigquery', {
        sql_query: generatedSqlQuery,
        original_query: query,
        query_description: queryDescription,
        table_reference: `${project_id}.${dataset_name}.${selectedTable}`
      });

      // Check for error in BigQuery response
      if (bigqueryResponse.data.error) {
        setError(bigqueryResponse.data.message);
        setIsLoading(false);
        return;
      }

      const newResult = {
        ...bigqueryResponse.data,
        query_description: queryDescription,
      };

      // When adding to chat history, include a default chart type
      const newChatHistoryItem: ChatHistoryItem = {
        id: `chat_${Date.now()}`,
        timestamp: new Date(),
        query,
        result: newResult,
        chartType: newResult.chart_type?.toLowerCase() || 'column' // Set initial chart type
      };

      setChatHistory(prev => [...prev, newChatHistoryItem]);
      setQueryResult(newResult);

      // Clear query input after successful submission
      setQuery('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'An error occurred while processing your query';

        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChartForItem = (item: ChatHistoryItem) => {
    const chartData = item.result.data.map((row) => {
      const keys = Object.keys(row);
      return {
        name: row[keys[0]],
        y: Number(row[keys[1]]),
      };
    });

    const chartOptions = {
      chart: {
        // Use item-specific chartType
        type: item.chartType || 'column',
      },
      title: {
        text: 'Query Visualization',
      },
      colors: COLOR_PALETTES[selectedColorPalette],
      xAxis: {
        categories:
          (item.chartType || 'column') !== 'pie'
            ? chartData.map((item) => item.name)
            : undefined,
        title: {
          text: item.result.columns[0],
        },
      },
      yAxis:
        (item.chartType || 'column') !== 'pie'
          ? {
            title: {
              text: item.result.columns[1],
            },
          }
          : undefined,
      series: [
        {
          name: item.result.columns[1],
          data:
            (item.chartType || 'column') === 'pie'
              ? chartData.map((item) => ({ name: item.name, y: item.y }))
              : chartData.map((item) => item.y),
        },
      ],
      plotOptions: {
        series: {
          allowPointSelect: true,
        },
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f}%',
          },
        },
      },
      exporting: {
        enabled: false,
      },
    };

    return (
      <div
        className={`mt-4 ${
          isFullScreen
            ? 'fixed inset-0 z-50 bg-white/95 p-8 flex flex-col items-center justify-center overflow-auto'
            : ''
        }`}
      >
        <div className="flex justify-between mb-4 w-full max-w-6xl">
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
            {CHART_TYPES.map(({ type, label, Icon }) => (
              <div key={type} className="relative group">
                <button
                  onClick={() => {
                    // Update the specific chat history item's chart type
                    setChatHistory((prev) =>
                      prev.map((chatItem) =>
                        chatItem.id === item.id
                          ? { ...chatItem, chartType: type }
                          : chatItem
                      )
                    );
                  }}
                  className={`p-2 rounded-md transition-all ${
                    item.chartType === type
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </button>
                {/* Tooltip */}
                <div
                  className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                    bg-gray-700 text-white text-xs rounded-md py-1 px-2 opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300 
                    pointer-events-none whitespace-nowrap"
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Color Palette Dropdown */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedColorPalette}
              onChange={(e) => {
                const palette = e.target.value as ColorPaletteKey;
                setSelectedColorPalette(palette);
              }}
              className="appearance-none w-48 bg-white border-2 border-blue-200 
            rounded-lg pl-4 pr-8 py-3 text-gray-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-300 ease-in-out
            hover:border-blue-300 hover:shadow-md
            text-base font-medium"
            >
              {Object.keys(COLOR_PALETTES).map((palette) => (
                <option
                  key={palette}
                  value={palette}
                  className="bg-white text-gray-800 hover:bg-blue-50"
                >
                  {palette.charAt(0).toUpperCase() + palette.slice(1)} Palette
                </option>
              ))}
            </select>

            <button
              onClick={handleToggleFullScreen}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center"
            >
              {isFullScreen ? <Shrink className="mr-2" /> : <Expand className="mr-2" />}
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
          </div>
        </div>
        <div className="h-[calc(100vh-250px)] w-full">
          <HighchartsReact
            key={`${item.id}-${item.chartType}-${selectedColorPalette}`}
            highcharts={Highcharts}
            options={chartOptions}
            ref={chartComponentRef}
          />
        </div>
      </div>
    );
  };

  const renderChatHistoryItem = (item: ChatHistoryItem) => {
    return (
      <div key={item.id} className="flex flex-col w-full mb-4">
        {/* Query Section - Right Aligned Message Bubble */}
        <div className="flex justify-end w-full mb-2">
          <div className="relative max-w-[80%] bg-white/80 rounded-2xl p-4 shadow-sm border border-blue-400">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {item.timestamp.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-600">Query:</h3>
              <p className="font-bold text-xl text-blue-700">{item.query}</p>
            </div>
          </div>
        </div>

        {/* Response Section - Left Aligned Message Bubble */}
        <div className="flex justify-start w-full mb-4">
          <div className="relative max-w-[80%] bg-white rounded-2xl p-4 shadow-sm border border-blue-400">
            {/* Results Section */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-600">Results:</h3>
              <div className="w-auto ml-8 rounded-lg border">
                <table className="w-auto border-collapse border border-blue-400  shadow-md rounded-lg ">
                  <thead>
                    <tr>
                      {item.result.columns.map((column) => (
                        <th
                          key={column}
                          className="border border-blue-400 px-4 py-2 bg-gray-100 font-bold text-left text-gray-700"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.result.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-100 transition-colors">
                        {item.result.columns.map((column) => (
                          <td
                            key={column}
                            className="border border-blue-400 px-4 py-2 text-sm text-gray-800"
                          >
                            {row[column] as string | number | boolean | null}
                          </td>
                        ))}
                      </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Descriptive Sections */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-400 shadow-sm">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">Data Interpretation</h3>
                    <p className="text-blue-800">{item.result.query_description || 'No description available'}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-400 shadow-sm">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">LLM Viz</h3>
                    <p className="text-blue-800">{item.result.llm_recommendation || 'No recommendation available'}</p>
                  </div>
                </div>

                {/* Chart in Chat History */}
                {item.result.data && item.result.data.length > 0 && (
                  <div className="mt-4">
                    {renderChartForItem(item)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      };

      return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
          {/* Use the new DataConnectionSidebar component */}
          <DataConnectionSidebar 
            onConnectionChange={(connection: React.SetStateAction<string>) => setSelectedConnection(connection)}
            onDatasetChange={(dataset: React.SetStateAction<string>) => setSelectedDataset(dataset)}
            onTableChange={(table: React.SetStateAction<string>) => setSelectedTable(table)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <h1 className="text-xl font-bold tracking-tight">InsightPlatrAI</h1>
              </div>
            </div>

            {/* Query Input with Enhanced Design */}
            <div className="px-8 py-6 bg-white/50 backdrop-blur-sm">
              <div className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-14 pr-36 py-4 border-2 border-transparent 
                    bg-gray-100 rounded-2xl text-gray-900 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-300 
                    focus:bg-white transition-all duration-300 
                    text-lg placeholder-gray-500 shadow-lg"
                />
                <Search
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 
                    text-gray-500 w-6 h-6"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 
                    bg-gradient-to-r from-blue-600 to-purple-700 
                    text-white px-6 py-3 rounded-xl 
                    hover:opacity-90 transition-all 
                    disabled:opacity-50 flex items-center 
                    space-x-2 shadow-md hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Submit Query'
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="px-4 mb-4">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center shadow-md">
                  <AlertTriangle className="mr-3 text-red-500 w-6 h-6" />
                  <p className="font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Results Section with Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div
                ref={chatHistoryRef}
                className="max-w-full overflow-y-auto space-y-6 h-[calc(100vh-300px)] pr-4"
              >
                {/* Chat History Scrollable Area */}
                <div className="space-y-4">
                  {chatHistory.map(renderChatHistoryItem)}
                  <div ref={resultsEndRef} /> {/* Scroll anchor */}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default DataGPT;


