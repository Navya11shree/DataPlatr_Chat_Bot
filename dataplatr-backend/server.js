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











// //datagpt code added Gemini and BigQuery
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const axios = require('axios'); // For calling Gemini and BigQuery REST APIs
// require('dotenv').config();

// const app = express();
// const port = 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // ===== DataPlatrInterface Code (No Changes Made) =====

// // BigQuery client for DataPlatrInterface (using its own service account)
// const { BigQuery } = require('@google-cloud/bigquery');
// const bigqueryDefault = new BigQuery({
//   projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GCP_KEY_FILE, // BigQuery service account for DataPlatrInterface
// });

// // Test BigQuery connection and get datasets
// app.post('/api/connect-bigquery', async (req, res) => {
//   try {
//     const [datasets] = await bigqueryDefault.getDatasets();
//     res.status(200).json({
//       message: 'Successfully connected to BigQuery',
//       projectId: process.env.GCP_PROJECT_ID,
//       datasets: datasets.map((dataset) => dataset.id),
//     });
//   } catch (error) {
//     console.error('Error connecting to BigQuery:', error);
//     res.status(500).json({ message: 'Failed to connect to BigQuery', error: error.message });
//   }
// });

// // Get tables for a specific dataset
// app.get('/api/tables/:datasetId', async (req, res) => {
//   try {
//     const datasetId = req.params.datasetId;
//     const dataset = bigqueryDefault.dataset(datasetId);
//     const [tables] = await dataset.getTables();
//     res.status(200).json({
//       message: 'Successfully retrieved tables',
//       tables: tables.map((table) => table.id),
//     });
//   } catch (error) {
//     console.error('Error getting tables:', error);
//     res.status(500).json({ message: 'Failed to get tables', error: error.message });
//   }
// });

// // Get table schema and preview data
// app.get('/api/preview/:datasetId/:tableId', async (req, res) => {
//   try {
//     const { datasetId, tableId } = req.params;
//     const dataset = bigqueryDefault.dataset(datasetId);
//     const table = dataset.table(tableId);

//     const [metadata] = await table.getMetadata();

//     const query = `
//       SELECT *
//       FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.${tableId}\`
//       LIMIT 10
//     `;
//     const [rows] = await bigqueryDefault.query(query);

//     res.status(200).json({
//       message: 'Successfully retrieved table preview',
//       schema: metadata.schema,
//       previewData: rows,
//     });
//   } catch (error) {
//     console.error('Error getting table preview:', error);
//     res.status(500).json({ message: 'Failed to get table preview', error: error.message });
//   }
// });

// // Execute custom SQL query (DataPlatrInterface client)
// app.post('/api/query', async (req, res) => {
//   try {
//     const { query } = req.body;
//     const [rows] = await bigqueryDefault.query(query);
//     res.status(200).json({
//       message: 'Query executed successfully',
//       results: rows,
//     });
//   } catch (error) {
//     console.error('Error executing query:', error);
//     res.status(500).json({ message: 'Failed to execute query', error: error.message });
//   }
// });

// // ===== New DataGPT Functionality =====

// // Gemini and BigQuery API URLs
// const GEMINI_API_URL = process.env.GEMINI_API_URL || 'http://127.0.0.1:8080/gemini';
// const DATAGPT_BIGQUERY_API_URL = process.env.DATAGPT_BIGQUERY_API_URL || 'http://127.0.0.1:8080/api/bigquery';

// // Safety settings for Gemini API
// const safetySettings = [
//   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
// ];

// // Function to generate SQL from Gemini API
// async function generateSQLQuery(userQuery) {
//   const requestBody = {
//     prompt: `Convert this to SQL: ${userQuery} for the table 'dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails'`,
//     model: 'gemini-pro',
//     params: {
//       temperature: 0.4,
//       top_p: 1,
//       top_k: 32,
//       max_output_tokens: 4096,
//     },
//     safetySettings: safetySettings,
//   };

//   try {
//     const response = await axios.post(GEMINI_API_URL, requestBody, {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     return response.data.sqlQuery; // Return the SQL query generated by Gemini
//   } catch (error) {
//     console.error('Error generating SQL query from Gemini:', error.response?.data || error.message);
//     throw new Error('Failed to generate SQL query from Gemini');
//   }
// }

// // Function to execute SQL query on BigQuery via REST API
// async function executeBigQuery(sqlQuery) {
//   try {
//     const response = await axios.post(
//       DATAGPT_BIGQUERY_API_URL,
//       {
//         query: sqlQuery,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     return response.data.results; // Return BigQuery results
//   } catch (error) {
//     console.error('Error querying BigQuery:', error.response?.data || error.message);
//     throw new Error('Failed to query BigQuery');
//   }
// }

// // New route for DataGPT query
// app.post('/api/datagpt-query', async (req, res) => {
//   const { userQuery } = req.body;

//   if (!userQuery) {
//     return res.status(400).json({ message: 'User query is required' });
//   }

//   try {
//     // Step 1: Generate SQL query using Gemini
//     const sqlQuery = await generateSQLQuery(userQuery);

//     // Step 2: Execute SQL query using BigQuery
//     const results = await executeBigQuery(sqlQuery);

//     res.status(200).json({
//       message: 'Query executed successfully',
//       sqlQuery,
//       results,
//     });
//   } catch (error) {
//     console.error('Error in DataGPT query:', error.message);
//     res.status(500).json({ message: 'Failed to process DataGPT query', error: error.message });
//   }
// });

// //Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
// // app.listen(8080, '192.168.20.3', () => {
// //   console.log('Server running on http://192.168.20.3:8080');
// // });











