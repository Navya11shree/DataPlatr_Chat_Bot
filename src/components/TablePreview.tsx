// // TablePreview.tsx
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { X, Table as TableIcon, Loader2, AlertTriangle } from 'lucide-react';

interface RowData {
  [key: string]: string | number | boolean | null;
}

interface TablePreviewProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

const TablePreview: React.FC<TablePreviewProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const [previewData, setPreviewData] = useState<{
    data: RowData[];
    columns: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTablePreview = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/api/bigquery/preview', {
        params: {
          project_id: projectId,
          dataset_id: datasetId,
          table_id: tableId,
        },
      });

      if (response.data.error) {
        setError(response.data.message);
        return;
      }

      setPreviewData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch table preview');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, datasetId, tableId]);

  React.useEffect(() => {
    fetchTablePreview();
  }, [fetchTablePreview]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
        <div className="flex justify-center items-center h-40">
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-lg font-semibold">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-lg font-semibold">Error</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
      {/* Fixed Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Table Preview</h2>
          <span className="text-sm text-gray-500">
            ({previewData.data.length} rows)
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            <span className="font-semibold">{tableId}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-blue-200 rounded-lg overflow-auto max-h-96">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-blue-50">
            <tr>
              {previewData.columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-r border-blue-200 px-4 py-2 text-left text-gray-700 font-semibold whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {previewData.columns.map((column) => (
                  <td
                    key={column}
                    className="border-b border-r border-blue-200 px-4 py-2 text-sm text-gray-800 whitespace-nowrap"
                  >
                    {String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablePreview;