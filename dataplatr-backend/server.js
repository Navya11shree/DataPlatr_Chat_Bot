//backend/SERVER.JS 
//code until table preview 
 const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE, // Path to your service account key file
});

// Test BigQuery connection and get datasets
app.post('/api/connect-bigquery', async (req, res) => {
  try {
    // List all datasets in the project
    const [datasets] = await bigquery.getDatasets();
    
    res.status(200).json({
      message: 'Successfully connected to BigQuery',
      projectId: process.env.GCP_PROJECT_ID,
      datasets: datasets.map(dataset => dataset.id)
    });
  } catch (error) {
    console.error('Error connecting to BigQuery:', error);
    res.status(500).json({
      message: 'Failed to connect to BigQuery',
      error: error.message
    });
  }
});

// Get tables for a specific dataset
app.get('/api/tables/:datasetId', async (req, res) => {
  try {
    const datasetId = req.params.datasetId;
    const dataset = bigquery.dataset(datasetId);
    
    // Get all tables in the dataset
    const [tables] = await dataset.getTables();
    
    res.status(200).json({
      message: 'Successfully retrieved tables',
      tables: tables.map(table => table.id)
    });
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({
      message: 'Failed to get tables',
      error: error.message
    });
  }
});

// Get table schema and preview data
app.get('/api/preview/:datasetId/:tableId', async (req, res) => {
  try {
    const { datasetId, tableId } = req.params;
    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);

    // Get table metadata (including schema)
    const [metadata] = await table.getMetadata();

    // Query for preview data (first 10 rows)
    const query = `
      SELECT *
      FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.${tableId}\`
      LIMIT 10
    `;

    const [rows] = await bigquery.query(query);

    res.status(200).json({
      message: 'Successfully retrieved table preview',
      schema: metadata.schema,
      previewData: rows
    });
  } catch (error) {
    console.error('Error getting table preview:', error);
    res.status(500).json({
      message: 'Failed to get table preview',
      error: error.message
    });
  }
});

// Execute custom SQL query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Execute the query
    const [rows] = await bigquery.query(query);
    
    res.status(200).json({
      message: 'Query executed successfully',
      results: rows
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({
      message: 'Failed to execute query',
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});







