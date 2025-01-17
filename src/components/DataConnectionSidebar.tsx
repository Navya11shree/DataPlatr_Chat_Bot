//DataConnectionSidebar.tsx
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Layers, 
  Table, 
  Database, 
  Search, 
  X 
} from 'lucide-react';

interface DataConnectionSidebarProps {
  onConnectionChange: (connection: string) => void;
  onDatasetChange: (dataset: string) => void;
  onTableChange: (table: string) => void;
}

const DataConnectionSidebar: React.FC<DataConnectionSidebarProps> = ({
  onConnectionChange,
  onDatasetChange,
  onTableChange
}) => {
  // State for BigQuery connection details
  const [connections, setConnections] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Search states
  const [datasetSearch, setDatasetSearch] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Filtered datasets and tables based on search
  const filteredDatasets = datasets.filter(dataset =>
    dataset.toLowerCase().includes(datasetSearch.toLowerCase())
  );

  const filteredTables = tables.filter(table =>
    table.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // Fetch connection details on component mount
  useEffect(() => {
    const fetchConnectionDetails = async () => {
      try {
        // Fetch connections
        const connectionsResponse = await axios.get('http://127.0.0.1:8080/api/bigquery/connections');
        setConnections(connectionsResponse.data);

        // Auto-select first connection if available
        if (connectionsResponse.data.length > 0) {
          const firstConnection = connectionsResponse.data[0];
          setSelectedConnection(firstConnection);
          onConnectionChange(firstConnection);

          // Fetch datasets for the selected connection
          const datasetsResponse = await axios.get('http://127.0.0.1:8080/api/bigquery/datasets');
          setDatasets(datasetsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching connection details:', err);
      }
    };

    fetchConnectionDetails();
  }, [onConnectionChange]);

  // Fetch tables when dataset changes
  useEffect(() => {
    const fetchTables = async () => {
      if (selectedDataset) {
        try {
          const tablesResponse = await axios.get(`http://127.0.0.1:8080/api/bigquery/tables?dataset_id=${selectedDataset}`);
          setTables(tablesResponse.data);
        } catch (err) {
          console.error('Error fetching tables:', err);
        }
      }
    };

    fetchTables();
  }, [selectedDataset]);

  // Function to render searchable select component
  const renderSearchableSelect = (
    value: string,
    onChange: (value: string) => void,
    options: string[],
    placeholder: string,
    searchValue: string,
    onSearchChange: (value: string) => void
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="relative" ref={selectRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg 
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
        cursor-pointer flex items-center justify-between"
        >
          <span>{value || placeholder}</span>
        </div>

        {isOpen && (
          <div
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
          rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {/* Search Input */}
            <div className="p-2 sticky top-0 bg-white border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${placeholder}`}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 
                text-gray-500 w-4 h-4"
                />
                {searchValue && (
                  <X
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 
                  text-gray-500 w-4 h-4 cursor-pointer hover:text-gray-700"
                  />
                )}
              </div>
            </div>

            {/* Options List */}
            <ul className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                options.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      onChange(option);
                      onSearchChange('');
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer 
                  transition-colors duration-200"
                  >
                    {option}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-lg">
      {/* Fixed Header */}
      <div className="px-6 py-5 bg-blue-700
        text-white sticky top-0 z-10 flex items-center space-x-3">
        <Database className="w-6 h-6 text-white/80" />
        <h2 className="text-2xl font-bold tracking-wide">Connection</h2>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-4">
        {/* Project/Connection Dropdown */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Layers className="mr-2 text-blue-500" /> Project
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => {
              const connection = e.target.value;
              setSelectedConnection(connection);
              onConnectionChange(connection);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg 
              truncate overflow-ellipsis max-w-full
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {connections.map((connection) => (
              <option
                key={connection}
                value={connection}
                className="truncate"
              >
                {connection}
              </option>
            ))}
          </select>
        </div>

        {/* Dataset Dropdown with Search */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Layers className="mr-2 text-blue-500" /> Dataset
          </label>
          {renderSearchableSelect(
            selectedDataset,
            (dataset) => {
              setSelectedDataset(dataset);
              onDatasetChange(dataset);
              // Reset table selection when dataset changes
              setSelectedTable('');
              onTableChange('');
            },
            filteredDatasets,
            'Select a Dataset',
            datasetSearch,
            setDatasetSearch
          )}
        </div>

        {/* Table Dropdown with Search */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Table className="mr-2 text-blue-500" /> Table
          </label>
          {renderSearchableSelect(
            selectedTable,
            (table) => {
              setSelectedTable(table);
              onTableChange(table);
            },
            filteredTables,
            'Select a Table',
            tableSearch,
            setTableSearch
          )}
        </div>
      </div>
    </div>
  );
};

export default DataConnectionSidebar;