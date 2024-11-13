//backend/SERVER.JS 
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




//updated v1beta wityh datastoreservice client( not working)

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const { BigQuery } = require('@google-cloud/bigquery');

// // Import v1beta from @google-cloud/discoveryengine
// const { v1beta } = require('@google-cloud/discoveryengine');

// // Debugging step: log the entire export of v1beta
// console.log('v1beta:', v1beta);

// require('dotenv').config();

// const app = express();
// const port = 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Initialize BigQuery client (with service account key file)
// const bigquery = new BigQuery({
//   projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GCP_KEY_FILE,  // Key file for BigQuery
// });

// // Initialize Gen AI Search client using v1beta (DataStoreServiceClient)
// let genaiClient;
// if (v1beta && v1beta.DataStoreServiceClient) {
//   genaiClient = new v1beta.DataStoreServiceClient({
//     projectId: process.env.GCP_PROJECT_ID,  // GCP Project ID from environment variables
//     // No need for keyFilename, as we are using default credentials
//   });
// } else {
//   console.error('DataStoreServiceClient from v1beta is not available');
// }

// if (genaiClient) {
//   console.log('GenAI client initialized');
// } else {
//   console.log('Failed to initialize GenAI client');
// }

// // ============= BigQuery Endpoints =============

// // Test BigQuery connection and get datasets
// app.post('/api/connect-bigquery', async (req, res) => {
//   try {
//     const [datasets] = await bigquery.getDatasets();
    
//     res.status(200).json({
//       message: 'Successfully connected to BigQuery',
//       projectId: process.env.GCP_PROJECT_ID,
//       datasets: datasets.map(dataset => dataset.id)
//     });
//   } catch (error) {
//     console.error('Error connecting to BigQuery:', error);
//     res.status(500).json({
//       message: 'Failed to connect to BigQuery',
//       error: error.message
//     });
//   }
// });

// // Get tables for a specific dataset
// app.get('/api/tables/:datasetId', async (req, res) => {
//   try {
//     const datasetId = req.params.datasetId;
//     const dataset = bigquery.dataset(datasetId);
    
//     const [tables] = await dataset.getTables();
    
//     res.status(200).json({
//       message: 'Successfully retrieved tables',
//       tables: tables.map(table => table.id)
//     });
//   } catch (error) {
//     console.error('Error getting tables:', error);
//     res.status(500).json({
//       message: 'Failed to get tables',
//       error: error.message
//     });
//   }
// });

// // Get table schema and preview data
// app.get('/api/preview/:datasetId/:tableId', async (req, res) => {
//   try {
//     const { datasetId, tableId } = req.params;
//     const dataset = bigquery.dataset(datasetId);
//     const table = dataset.table(tableId);

//     const [metadata] = await table.getMetadata();

//     const query = `SELECT * FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.${tableId}\` LIMIT 10`;

//     const [rows] = await bigquery.query(query);

//     res.status(200).json({
//       message: 'Successfully retrieved table preview',
//       schema: metadata.schema,
//       previewData: rows
//     });
//   } catch (error) {
//     console.error('Error getting table preview:', error);
//     res.status(500).json({
//       message: 'Failed to get table preview',
//       error: error.message
//     });
//   }
// });

// // ============= Gen AI Search Endpoints =============

// // Get Gen AI datastore information
// app.get('/api/genai-datastore', async (req, res) => {
//   try {
//     const datastoreId = process.env.GENAI_DATASTORE_ID;
//     const name = `projects/${process.env.GCP_PROJECT_NUMBER}/locations/${process.env.LOCATION}/collections/default_collection/dataStores/${datastoreId}`;
    
//     const [datastore] = await genaiClient.getDataStore({
//       name: name
//     });

//     res.status(200).json({
//       message: 'Successfully retrieved Gen AI datastore',
//       datastore: {
//         id: datastoreId,
//         name: datastore.displayName || datastoreId,
//         servingConfigId: process.env.GENAI_SERVING_CONFIG_ID
//       }
//     });
//   } catch (error) {
//     console.error('Error getting Gen AI datastore:', error);
//     res.status(500).json({
//       message: 'Failed to get Gen AI datastore',
//       error: error.message
//     });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// module.exports = app;
