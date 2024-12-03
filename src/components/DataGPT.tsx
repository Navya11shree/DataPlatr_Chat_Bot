//FRONTEND/DATAGPT.TSX
import React, { useState, useRef } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
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
  Loader2 
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
  chart_description?: string;
}

interface DataGPTProps {
  onBack?: () => void;
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
  const [chartTypeToDisplay, setChartTypeToDisplay] = useState<string>('column');
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPaletteKey>('default');

  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const geminiResponse = await axios.post('http://127.0.0.1:8080/gemini', { query });
      const generatedSqlQuery = geminiResponse.data.sql_query;
      const queryDescription = geminiResponse.data.query_description;

      const bigqueryResponse = await axios.post('http://127.0.0.1:8080/api/bigquery', {
        sql_query: generatedSqlQuery,
        original_query: query,
        query_description: queryDescription
      });

      setQueryResult({
        ...bigqueryResponse.data,
        query_description: queryDescription,
      });
      setChartTypeToDisplay(bigqueryResponse.data.chart_type?.toLowerCase() || 'column');
    } catch (err) {
      setError('An error occurred while processing your query.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const renderChart = () => {
    if (!queryResult || !queryResult.data.length) return null;

    const chartData = queryResult.data.map((row) => {
      const keys = Object.keys(row);
      return {
        name: row[keys[0]],
        y: Number(row[keys[1]]),
      };
    });

    const chartOptions = {
      chart: {
        type: chartTypeToDisplay,
      },
      title: {
        text: 'Query Visualization',
      },
      colors: COLOR_PALETTES[selectedColorPalette],
      xAxis: {
        categories:
          chartTypeToDisplay !== 'pie'
            ? chartData.map((item) => item.name)
            : undefined,
        title: {
          text: queryResult.columns[0],
        },
      },
      yAxis:
        chartTypeToDisplay !== 'pie'
          ? {
              title: {
                text: queryResult.columns[1],
              },
            }
          : undefined,
      series: [
        {
          name: queryResult.columns[1],
          data:
            chartTypeToDisplay === 'pie'
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
      <div className={`mt-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-8 overflow-auto' : ''}`}>
        <div className="flex justify-between mb-2 space-x-2">
          <div className="flex space-x-2">
            {/* Chart Type Selector with Icons and Tooltips */}
            <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
              {CHART_TYPES.map(({ type, label, Icon }) => (
                <div key={type} className="relative group">
                  <button
                    onClick={() => setChartTypeToDisplay(type)}
                    className={`p-2 rounded-md transition-all ${
                      chartTypeToDisplay === type
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                    bg-gray-800 text-white text-xs rounded-md py-1 px-2 opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300 
                    pointer-events-none whitespace-nowrap">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Color Palette Dropdown with Better Styling */}
            <div className="relative">
              <select
                value={selectedColorPalette}
                onChange={(e) => {
                  const palette = e.target.value as ColorPaletteKey;
                  setSelectedColorPalette(palette);
                }}
                className="appearance-none w-full bg-gray-100 border-none rounded-lg 
                           pl-4 pr-8 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(COLOR_PALETTES).map((palette) => (
                  <option key={palette} value={palette}>
                    {palette.charAt(0).toUpperCase() + palette.slice(1)} Palette
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            <button
              onClick={handleToggleFullScreen}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center"
            >
              {isFullScreen ? <Shrink className="mr-2" /> : <Expand className="mr-2" />}
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
          </div>
        </div>
        <div className={isFullScreen ? 'max-w-full h-full' : ''}>
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            ref={chartComponentRef}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-0 m-0 overflow-auto">
      <div className="w-full h-full container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="w-full h-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          {/* Header - Full Width */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-xl md:text-2xl font-bold">InsightPlatrAI</h1>
            </div>
          </div>

          {/* Main Content - Flexible Layout */}
          <div className="flex-grow overflow-auto p-4 md:p-6 grid grid-cols-1 gap-6">
            {/* Query Input Section - Full Width */}
            <div className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a data question in plain English"
                  className="w-full pl-12 pr-32 py-3 border-2 border-gray-300 rounded-xl 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:border-transparent text-gray-700 
                             transition-all duration-300 shadow-sm"
                />
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 
                             text-gray-400 w-5 h-5"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 
                             bg-gradient-to-r from-blue-500 to-purple-600 
                             text-white px-4 py-2 rounded-lg 
                             hover:opacity-90 transition-all 
                             disabled:opacity-50 flex items-center space-x-2"
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

            {/* Results Section - Scrollable */}
            {queryResult && (
              <div className="space-y-6 overflow-y-auto">
                {/* Error Handling */}
                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
                    <p className="font-semibold">{error}</p>
                  </div>
                )}

                {/* Table Preview - Responsive */}
                <div className="overflow-x-auto shadow-md rounded-lg border">
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr>
                        {queryResult.columns.map((column) => (
                          <th
                            key={column}
                            className="border px-4 py-2 bg-gray-200 font-bold text-left"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          {queryResult.columns.map((column) => (
                            <td
                              key={column}
                              className="border px-4 py-2 text-sm text-gray-700"
                            >
                              {row[column] as string | number | boolean | null}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Descriptive Sections - Responsive Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Results Description</h3>
                    <p className="text-gray-600">{queryResult.query_description || 'No description available'}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">LLM Recommendation</h3>
                    <p className="text-blue-600">{queryResult.llm_recommendation || 'No recommendation available'}</p>
                  </div>
                </div>

                {/* Chart Section - Full Width */}
                {queryResult && queryResult.data.length > 0 && renderChart()}

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Chart Description</h3>
                  <p className="text-green-600">{queryResult.chart_description || 'No chart description available'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
    </div>
  );
};

export default DataGPT;