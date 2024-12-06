
#DataGPT backend
import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from google.cloud import bigquery
import plotly.express as px
import pandas as pd
import json
import logging

app = Flask(__name__)
CORS(app)

# Configure credentials (these should be set as environment variables in production)
BIGQUERY_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-bigquery.json"
GEMINI_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-gemini.json"

# Dataset ID
DATASET_ID = "dataplatr-sandbox.LLM_UseCases"
# Logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Generation configuration for Gemini
generation_config = {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}
# Retrieve dataset schema
def get_dataset_schema(dataset_id):
    """Fetches schema details for all tables in the specified dataset, including column types."""
    bq_client = initialize_bigquery()
    tables = bq_client.list_tables(dataset_id)
    schema = {}
    for table in tables:
        table_ref = f"{table.project}.{table.dataset_id}.{table.table_id}"
        table_info = bq_client.get_table(table_ref)
        schema[table.table_id] = [(field.name, field.field_type) for field in table_info.schema]
    return schema

# Gemini Configuration
def configure_gemini():
    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GEMINI_CREDENTIALS
        genai.configure()
        
        return genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config=generation_config
        )
    except Exception as e:
        logger.error(f"Gemini configuration error: {e}")
        logger.error(traceback.format_exc())
        raise

# BigQuery Initialization
def initialize_bigquery():
    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = BIGQUERY_CREDENTIALS
        return bigquery.Client()
    except Exception as e:
        logger.error(f"BigQuery initialization error: {e}")
        logger.error(traceback.format_exc())
        raise

# New BigQuery Connection Detail Routes
@app.route('/api/bigquery/connections', methods=['GET'])
def get_bigquery_connections():
    try:
        bq_client = initialize_bigquery()
        projects = list(bq_client.list_projects())
        project_ids = [project.project_id for project in projects]
        
        logger.info(f"Fetched {len(project_ids)} BigQuery projects")
        return jsonify(project_ids)
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery connections: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to fetch BigQuery connections', 'details': str(e)}), 500

@app.route('/api/bigquery/datasets', methods=['GET'])
def get_bigquery_datasets():
    try:
        bq_client = initialize_bigquery()
        project_id = bq_client.project
        
        datasets = list(bq_client.list_datasets())
        dataset_ids = [f"{project_id}.{dataset.dataset_id}" for dataset in datasets]
        
        logger.info(f"Fetched {len(dataset_ids)} datasets for project {project_id}")
        return jsonify(dataset_ids)
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery datasets: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to fetch BigQuery datasets', 'details': str(e)}), 500

@app.route('/api/bigquery/tables', methods=['GET'])
def get_bigquery_tables():
    try:
        dataset_id = request.args.get('dataset_id')
        if not dataset_id:
            return jsonify({'error': 'Dataset ID is required'}), 400
        
        bq_client = initialize_bigquery()
        
        try:
            project_id, dataset_name = dataset_id.split('.')
        except ValueError:
            project_id = bq_client.project
            dataset_name = dataset_id
        
        dataset_ref = bigquery.DatasetReference(project_id, dataset_name)
        tables = list(bq_client.list_tables(dataset_ref))
        table_ids = [table.table_id for table in tables]
        
        logger.info(f"Fetched {len(table_ids)} tables for dataset {dataset_id}")
        return jsonify(table_ids)
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery tables: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to fetch BigQuery tables', 'details': str(e)}), 500
    
@app.route('/gemini', methods=['POST'])
def gemini_endpoint():
    try:
        logger.info(f"Gemini Endpoint - Received Request: {request.json}")

        data = request.json
        user_query = data.get('query', '')
        table_name = data.get('table_name', '')
        project_id = data.get('project_id', '')
        dataset_id = data.get('dataset_id', '')
        table_id = data.get('table_id', '')

        # Validate input parameters
        if not all([user_query, table_name, project_id, dataset_id, table_id]):
            logger.error("Missing required parameters for Gemini endpoint")
            return jsonify({
                'error': True,
                'message': 'All connection details and query are required'
            }), 400

        # Retrieve schema for ONLY the selected table
        bq_client = initialize_bigquery()
        table_ref = f"{project_id}.{dataset_id}.{table_id}"
        table = bq_client.get_table(table_ref)
        
        # Create schema just for the selected table
        schema = {
            table_id: [(field.name, field.field_type) for field in table.schema]
        }

        # Format the schema string specifically for the selected table
        schema_string = f"Table: {table_name}\nColumns: {', '.join([f'{name} ({dtype})' for name, dtype in schema[table_id]])}"

        model = configure_gemini()

        # Generate SQL query dynamically
        prompt = f"""
        Convert the following natural language query into an SQL query. Use ONLY the columns from the selected table: {table_name}

        Dataset schema for selected table:
        {schema_string}

        User query: {user_query}

         Provide the SQL query that answers the user's question, ensuring the following:
         1. Use only BigQuery-compatible syntax and functions and do not use functions as 'STRFTIME()' or STRFTIME_UTC which are not supported by BigQuery.
         2. When applying filters:
            - Prioritize using teh most relavant column with distinct values that closely match the keywords in the User query.
            - For example, if the user query mentions "Purchase Invoices" and the dataset schema contains distinct values in multiple columns such as ['Purchase Invoices', 'Sales Orders'] in `JournalCategory` or `TransactionType`, prefer the column that aligns with the user's intent, such as `JournalCategory`.
         3. If multiple columns have similar values, use the column with the most meaningful relationship to the User query context. For instance, for financial transactions, `JournalCategory` should be prioritized over `TransactionType`.

         4. If no data is retrieved from BigQuery, consider refining the query logic by re-evaluating the column selection or filters.
        """

        response = model.generate_content([prompt])
        query = response.text.strip().replace("```sql", "").replace("```", "").strip()


        # Validate that the query uses only the selected table
        if table_id.lower() not in query.lower():
            logger.error(f"Query does not match the selected table: {table_name}")
            return jsonify({
                'error': True,
                'message': f'Query must be based on selected table: {table_name}. Please select the correct table or rephrase your query.'
            }), 400

        # Execute query
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        datetime_column = [col for col in df.columns if
    pd.api.types.is_datetime64_any_dtype(df[col])]
        df=df.dropna(subset=datetime_column)
        
        # If no data is returned
        if df.empty:
            return jsonify({
                'error': True,
                'message': 'No data found matching the query for the selected table.'
            }), 404

        # Description prompt with table-specific context
        description_prompt = f"""
        you are an AI assistant that summarizes the results of following query in plain english.
        SQL Query: {query}
        Query Results (Sample): {df.head(5).to_json()}
        describe in brief what the data represents , 
        key metrics,and any important insights or patterns seamlessley without any astricks
        """
        description_response = model.generate_content([description_prompt])
        result_description = description_response.text.strip()

        logger.info(f"Generated SQL Query: {query}")

        return jsonify({
            'sql_query': query,
            'original_query': user_query,
            'query_description': result_description,
            'table_reference': table_name
        })
    
    except Exception as e:
        logger.error(f"Gemini Endpoint Error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': True,
            'message': 'Internal server error occurred during query processing',
            'details': str(e)
        }), 500

def convert_datetime(obj):
    """
    Convert datetime objects to ISO format string or None for NaT values.
    
    Args:
        obj: Input value to convert
    
    Returns:
        Converted value (string, None, or original value)
    """
    if pd.isna(obj):
        return None
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj

@app.route('/api/bigquery', methods=['POST'])
def bigquery_endpoint():
    try:
        logger.info(f"BigQuery Endpoint - Received Request: {request.json}")

        data = request.json
        
        sql_query = data.get('sql_query', '')
        user_query = data.get('original_query', '')
        query_description = data.get('query_description', '')

        if not sql_query:
            return jsonify({
                'error': True, 
                'message': 'No SQL query provided'
            }), 400

        bq_client = initialize_bigquery()
        
        logger.info(f"Executing SQL Query: {sql_query}")
        query_job = bq_client.query(sql_query)
        
        df = query_job.to_dataframe()
        
        # Handle datetime columns
        datetime_columns = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
        
        # Drop rows with NaT values in datetime columns if they exist
        if datetime_columns:
            df = df.dropna(subset=datetime_columns)
        
        logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

        if df.empty:
            return jsonify({
                'error': True,
                'message': 'No data found for the query',
                'data': [],
                'columns': [],
                'chart_type': None
            }), 200

        model = configure_gemini()

        # Safely get sample values
        def get_sample_values(column):
            unique_values = column.unique()[:4]
            return ', '.join(map(lambda x: str(x) if x is not None else 'N/A', unique_values))

        sample_values_col1 = get_sample_values(df[df.columns[0]])
        sample_values_col2 = get_sample_values(df[df.columns[1]])

        description_prompt = f"""
        You are an AI assistant that summarizes query results in plain English.
        The result contains the following columns:{', '.join(df.columns.tolist())}.
        For the column {df.columns[0]}, here are some sample values: {sample_values_col1}.
        For the column {df.columns[1]}, here are some sample values: {sample_values_col2}.
        Question: {user_query}
        SQL Query: {sql_query}
        SQL Result: Describe what the result dataframe represents and not the sql query itself, key metrics, and any important aggregations or patterns for eg: "based on the results, category a has more sales than category b".
        Provide your response in the format:
        Description: [Summary of what the SQL Result contains including key metrics and patterns]
        """
        description_response = model.generate_content([description_prompt])
        data_preview_description = description_response.text.strip()

        viz_prompt = f"""
        You are an AI assistant that recommends appropriate data visualizations.
        Question: {user_query}
        SQL Query: {sql_query}
        Result Description: {data_preview_description}
        Provide your response in the format:
        Viz: [Chart type or "none"]
        """
        viz_response = model.generate_content([viz_prompt])

        chart_type = None
        if "Viz:" in viz_response.text:
            chart_type = viz_response.text.split("Viz:")[1].split("\n")[0].strip().lower()
            
            valid_chart_types = ["bar", "line", "scatter", "pie"]
            if chart_type and " " in chart_type:
                chart_type = chart_type.split()[0]
            
            if chart_type not in valid_chart_types:
                chart_type = None

        chart_description_prompt = f"""
        You are an AI assistant that describes charts in simple terms.
        Chart Type: {chart_type}
        Data Description: {data_preview_description}
        Describe what the chart illustrates and any key insights.
        Provide your response in the format:
        Chart Description: [Explanation of what the chart illustrates]
        """
        chart_description_response = model.generate_content([chart_description_prompt])
        chart_description = chart_description_response.text.strip()

        # Convert dataframe to dict with datetime handling
        processed_data = df.apply(
            lambda col: col.map(convert_datetime) if pd.api.types.is_datetime64_any_dtype(col) else col
        )

        response_data = {
            'data': processed_data.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'chart_type': chart_type,
            'llm_recommendation': viz_response.text,
            'data_preview_description': data_preview_description,
            'chart_description': chart_description,
            'query_description': query_description
        }

        logger.info("BigQuery Endpoint - Response Prepared")
        return jsonify(response_data)
    
    except Exception as e:
        logger.error(f"BigQuery Endpoint Error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)