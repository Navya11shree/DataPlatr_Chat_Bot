//Dataplaterinterface
import React, { useState, useEffect } from 'react';
import { FaChevronCircleDown, FaArrowLeft } from "react-icons/fa";
import { BiSolidRightArrow } from "react-icons/bi";
import { PiPaperPlaneRightFill } from "react-icons/pi";
import { FaDiagramProject, FaTableCells } from "react-icons/fa6";
import { FaDatabase } from "react-icons/fa";
import DataInsightsComponent from './DataInsightsComponent';

interface DataPlatrInterfaceProps {
  onBack: () => void;
}

interface BigQueryError {
  message: string;
  code?: string;
}

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

const DataPlatrInterface: React.FC<DataPlatrInterfaceProps> = ({ onBack }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<BigQueryError | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [datasets, setDatasets] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [isDatasetDropdownOpen, setIsDatasetDropdownOpen] = useState<boolean>(false);
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState<boolean>(false);
  const [tablePreview, setTablePreview] = useState<TablePreview | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<TablePreview | null>(null);

  useEffect(() => {
    connectToBigQuery();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchTables(selectedDataset);
    }
  }, [selectedDataset]);

  useEffect(() => {
    if (selectedDataset && selectedTable) {
      fetchTablePreview(selectedDataset, selectedTable);
    }
  }, [selectedDataset, selectedTable]);

  const connectToBigQuery = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/connect-bigquery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to connect to BigQuery');

      const data: { projectId: string; datasets: string[] } = await response.json();
      setProjectId(data.projectId);
      setDatasets(data.datasets);
    } catch (err) {
      setError({
        message: `Failed to connect to BigQuery: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (datasetId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/tables/${datasetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to fetch tables');

      const data: { tables: string[] } = await response.json();
      setTables(data.tables);
    } catch (err) {
      setError({
        message: `Failed to fetch tables: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTablePreview = async (datasetId: string, tableId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/preview/${datasetId}/${tableId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch table preview');

      const data: TablePreview = await response.json();
      setTablePreview(data);
    } catch (err) {
      setError({
        message: `Failed to fetch table preview: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (): Promise<void> => {
    if (!sqlQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlQuery })
      });

      if (!response.ok) throw new Error('Failed to execute query');

      const data: TablePreview = await response.json();
      setQueryResults(data);
      setTablePreview(data); // Update the table preview with query results
    } catch (err) {
      setError({
        message: `Failed to execute query: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = (
    isOpen: boolean,
    items: string[],
    onSelect: (item: string) => void,
    onClose: () => void,
    selectedValue?: string
  ) => {
    if (!isOpen) return null;

    return (
      <div className="absolute z-10 mt-1 w-2/3 right-0 bg-white border rounded shadow-lg">
        <div className="max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item}
              className={`cursor-pointer p-2 hover:bg-gray-200 ${selectedValue === item ? 'bg-blue-100' : ''
                }`}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTablePreview = () => {
    if (!tablePreview) return null;

    return (
      <div className="h-full overflow-auto border rounded-lg shadow-sm bg-gray-50">
        <table className="w-full">
          <thead className="bg-white sticky top-0 shadow-sm z-10">
            <tr>
              {tablePreview.schema.fields.map((field) => (
                <th
                  key={field.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                >
                  <div className="flex flex-col">
                    <span>{field.name}</span>
                    <span className="text-gray-400 text-xs normal-case">
                      {field.type} ({field.mode})
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tablePreview.previewData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                {tablePreview.schema.fields.map((field) => (
                  <td
                    key={field.name}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                  >
                    {typeof row[field.name] === 'object' && row[field.name] !== null && 'value' in row[field.name]
                      ? new Date(row[field.name].value).toLocaleDateString()
                      : row[field.name]?.toString() || 'null'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[360px] bg-white border-r overflow-y-auto max-h-svh">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
                title="Back to Demo Selection"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <img
                src="https://media.licdn.com/dms/image/v2/D560BAQGd9CNgsgxDGg/company-logo_200_200/company-logo_200_200/0/1727775506558/dataplatrinc_logo?e=1738800000&v=beta&t=M0FwxfZoe-YsswSG5cL9rbwznIxxm2Jbmf6_UFUdlXM"
                alt="Data Platr chat bot"
                className="w-8 h-8"
              />
              <span className="text-3xl font-bold text-black">Chat Platr</span>
            </div>

            <div className="space-y-4">
              {/* Project Selection */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-gray-500 w-1/3 flex items-center gap-2">
                    <FaDiagramProject className="w-5 h-5" />
                    Project
                  </label>
                  <div
                    className="flex items-center justify-between flex-1 mt-1 p-1.5 border rounded hover:border-gray-400 cursor-pointer"
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  >
                    <span className="text-sm text-gray-700">{projectId || 'Select Project'}</span>
                    <FaChevronCircleDown className={`w-4 h-4 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {renderDropdown(
                  isProjectDropdownOpen,
                  [projectId],
                  (item) => setProjectId(item),
                  () => setIsProjectDropdownOpen(false),
                  projectId
                )}
              </div>

              {/* Dataset Selection */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-gray-500 w-1/3 flex items-center gap-2">
                    <FaDatabase className="w-5 h-5" />
                    Dataset
                  </label>
                  <div
                    className="flex items-center justify-between flex-1 mt-1 p-1.5 border rounded hover:border-gray-400 cursor-pointer"
                    onClick={() => setIsDatasetDropdownOpen(!isDatasetDropdownOpen)}
                  >
                    <span className="text-sm text-gray-700">{selectedDataset || 'Select Dataset'}</span>
                    <FaChevronCircleDown className={`w-4 h-4 text-gray-400 transition-transform ${isDatasetDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {renderDropdown(
                  isDatasetDropdownOpen,
                  datasets,
                  (item) => setSelectedDataset(item),
                  () => setIsDatasetDropdownOpen(false),
                  selectedDataset
                )}
              </div>

              {/* Table Selection */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-gray-500 w-1/3 flex items-center gap-2">
                    <FaTableCells className="w-5 h-5" />
                    Table
                  </label>
                  <div
                    className="flex items-center justify-between flex-1 mt-1 p-1.5 border rounded hover:border-gray-400 cursor-pointer"
                    onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                  >
                    <span className="text-sm text-gray-700">{selectedTable || 'Select Table'}</span>
                    <FaChevronCircleDown className={`w-4 h-4 text-gray-400 transition-transform ${isTableDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {renderDropdown(
                  isTableDropdownOpen,
                  tables,
                  (item) => setSelectedTable(item),
                  () => setIsTableDropdownOpen(false),
                  selectedTable
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error.message}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-gray-500 text-sm mt-2">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
          {/* Header */}
          <div className="flex flex-col px-6 py-5 bg-white border-b shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-600">Table Preview</h2>
              <BiSolidRightArrow className="w-6 h-6 text-gray-400" />
            </div>

            {/* SQL Query Input */}
            <div className="flex gap-2">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Enter SQL query..."
                className="flex-1 p-2 border rounded-lg resize-none h-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={executeQuery}
                className="bg-blue-500 text-white rounded-lg h-10 w-10 flex items-center justify-center hover:bg-blue-600 transition-colors duration-150 shadow-sm"
              >
                <PiPaperPlaneRightFill className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 p-6 overflow-hidden">
            {(selectedTable || queryResults) && (
              <div className="bg-white rounded-lg shadow-lg h-full flex flex-col border border-gray-200">
                {/* Table Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-700">
                    {queryResults ? 'Query Results' : `${selectedDataset}.${selectedTable}`}
                  </h3>
                  {loading && (
                    <span className="text-sm text-gray-500">Loading preview...</span>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 text-sm p-4 border-b bg-red-50">
                    {error.message}
                  </div>
                )}

                {/* Table Preview */}
                <div className="flex-1 overflow-hidden p-4">
                  {renderTablePreview()}
                  <div className="flex-1 ml-4">
      {tablePreview && (
        <DataInsightsComponent tableData={tablePreview} />
      )}
    </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex bg-white border-t shadow-sm">

            <div className="flex-1 h-16 flex items-center px-6">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your query..."
                  className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="bg-blue-500 text-white rounded-lg h-10 w-10 flex items-center justify-center hover:bg-blue-600 transition-colors duration-150 shadow-sm">
                  <PiPaperPlaneRightFill className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPlatrInterface;