import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { FaChartLine, FaBolt } from 'react-icons/fa';

interface TablePreview {
  schema: {
    fields: {
      name: string;
      type: string;
      mode: string;
    }[];
  };
  previewData: any[];
}

interface InsightsComponentProps {
  tableData: TablePreview;
}

interface Insight {
  title: string;
  description: string;
  type: 'statistical' | 'trend' | 'anomaly';
}

const DataInsightsComponent: React.FC<InsightsComponentProps> = ({ tableData }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tableData && tableData.previewData.length > 0) {
      generateInsightsAndCharts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  const generateInsightsAndCharts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare data for insights generation
      const dataPrep = {
        headers: tableData.schema.fields.map(field => field.name),
        rows: tableData.previewData
      };

      // Generate insights via OpenAI
      const insightsResponse = await axios.post('http://localhost:5000/api/generate-insights', {
        data: dataPrep
      });

      setInsights(insightsResponse.data.insights);

      // Create chart data
      const numericColumns = tableData.schema.fields
        .filter(field => ['INTEGER', 'FLOAT', 'NUMERIC'].includes(field.type))
        .map(field => field.name);

      // If we have at least one numeric column, create a line chart
      if (numericColumns.length > 0) {
        const chartColumn = numericColumns[0];
        const chartData = tableData.previewData.map((row, index) => ({
          name: `Row ${index + 1}`,
          [chartColumn]: row[chartColumn]
        }));
        setChartData(chartData);
      }
    } catch (err) {
      setError('Failed to generate insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const chartColumn = Object.keys(chartData[0]).find(key => key !== 'name');
    if (!chartColumn) return null;

    return (
      <div className="w-full h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chartColumn} 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex items-center mb-4">
        <FaBolt className="mr-2 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-700">Automated Insights</h3>
      </div>

      {loading && (
        <div className="text-center text-gray-500">Generating insights...</div>
      )}

      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500"
            >
              <h4 className="font-medium text-gray-800">{insight.title}</h4>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <FaChartLine className="mr-2 text-blue-500" />
            <h4 className="text-md font-semibold text-gray-700">Data Visualization</h4>
          </div>
          {renderChart()}
        </div>
      )}
    </div>
  );
};

export default DataInsightsComponent;