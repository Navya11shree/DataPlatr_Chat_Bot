
import React, { useState } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Define a more specific type for row data
interface RowData {
  [key: string]: string | number | boolean | null;
}

interface QueryResult {
  data: RowData[];
  columns: string[];
  chart_type?: string;
  llm_recommendation?: string;
}

// Safe value rendering function
const renderValue = (value: unknown): React.ReactNode => {
  // Handle different types of values
  if (value === null || value === undefined) return '';
  
  // Convert to string for rendering
  return String(value);
};

// Update the component props to include optional onBack
interface DataGPTProps {
  onBack?: () => void;
}

const DataGPT: React.FC<DataGPTProps> = ({ onBack }) => {
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Use Gemini to generate SQL query
      const geminiResponse = await axios.post('http://127.0.0.1:8080/gemini', { query });
      const generatedSqlQuery = geminiResponse.data.sql_query;
      setSqlQuery(generatedSqlQuery);

      // Step 2: Execute query via BigQuery
      const bigqueryResponse = await axios.post('http://127.0.0.1:8080/api/bigquery', {
        sql_query: generatedSqlQuery,
        original_query: query
      });

      setQueryResult(bigqueryResponse.data);
    } catch (err) {
      setError('An error occurred while processing your query.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!queryResult || !queryResult.chart_type) return null;

    // Determine chart type
    const chartType = queryResult.chart_type.toLowerCase();

    // Prepare data for chart
    const chartData = queryResult.data.map(row => {
      // Assuming the first column is the category (x-axis)
      // and the second column is the value (y-axis)
      const keys = Object.keys(row);
      return {
        name: row[keys[0]],
        y: Number(row[keys[1]])
      };
    });

    const chartOptions = {
      chart: {
        type: chartType // 'bar', 'column', 'pie', etc.
      },
      title: {
        text: 'Query Visualization'
      },
      xAxis: {
        categories: chartData.map(item => item.name),
        title: {
          text: queryResult.columns[0]
        }
      },
      yAxis: {
        title: {
          text: queryResult.columns[1]
        }
      },
      series: [{
        name: queryResult.columns[1],
        data: chartData.map(item => item.y)
      }],
      plotOptions: {
        series: {
          allowPointSelect: true
        }
      }
    };

    return (
      <div className="mt-4">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Add back button if onBack prop is provided */}
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
        >
          ← Back
        </button>
      )}

      <h1 className="text-3xl font-bold mb-6">InsightPlatrAI</h1>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query in English"
          className="flex-grow p-2 border rounded-l"
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {sqlQuery && (
        <div className="mb-4">
          <h3 className="font-semibold">Generated SQL Query:</h3>
          <pre className="bg-gray-100 p-2 rounded">{sqlQuery}</pre>
        </div>
      )}

      {queryResult && (
        <div>
          <h3 className="font-semibold">Query Results</h3>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                {queryResult.columns.map((col, index) => (
                  <th key={index} className="border p-2 bg-gray-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {queryResult.columns.map((col, colIndex) => (
                    <td key={colIndex} className="border p-2">
                      {renderValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {queryResult.llm_recommendation && (
            <div className="mt-4 bg-blue-50 p-3 rounded">
              <h4 className="font-semibold">LLM Recommendation:</h4>
              <p>{queryResult.llm_recommendation}</p>
            </div>
          )}

          {renderChart()}
        </div>
      )}
    </div>
  );
};

export default DataGPT;