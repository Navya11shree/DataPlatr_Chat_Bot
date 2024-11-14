import React, { useEffect, useState } from 'react';
import axios from 'axios';

const GcpComponent: React.FC = () => {
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch the datasets from the backend
    axios.post('/api/connect-bigquery').then((response) => {
      setDatasets(response.data.datasets);
    });
  }, []);

  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDataset(datasetId);
    // Fetch tables for the selected dataset
    axios.get(`/api/tables/${datasetId}`).then((response) => {
      setTables(response.data.tables);
    });
  };

  const handleTablePreview = (datasetId: string, tableId: string) => {
    // Fetch preview data for the selected table
    axios.get(`/api/preview/${datasetId}/${tableId}`).then((response) => {
      setPreviewData(response.data.previewData);
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">GCP Dataset & Table Preview</h2>

      <div className="mb-4">
        <h3 className="text-lg">Datasets:</h3>
        <ul className="list-disc pl-5">
          {datasets.map((dataset) => (
            <li key={dataset}>
              <button
                onClick={() => handleDatasetSelect(dataset)}
                className="text-blue-500 underline"
              >
                {dataset}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedDataset && (
        <div className="mb-4">
          <h3 className="text-lg">Tables in {selectedDataset}:</h3>
          <ul className="list-disc pl-5">
            {tables.map((table) => (
              <li key={table}>
                <button
                  onClick={() => handleTablePreview(selectedDataset, table)}
                  className="text-green-500 underline"
                >
                  {table}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewData.length > 0 && (
        <div>
          <h3 className="text-lg">Preview Data:</h3>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GcpComponent;
