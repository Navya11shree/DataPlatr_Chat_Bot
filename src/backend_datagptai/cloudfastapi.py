from cmath import e
import os
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from google.cloud import bigquery
import plotly.express as px
import pandas as pd
import logging
import functions_framework
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure credentials (these should be set as environment variables in production)
BIGQUERY_CREDENTIALS = "E:\dataplatr_chatbot\src\credentials_resources\datagpt-bigquery.json"
GEMINI_CREDENTIALS = "E:\dataplatr_chatbot\src\credentials_resources\datagpt-gemini.json"

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

# Pydantic models for request validation
class GeminiRequest(BaseModel):
    query: str
    table_name: str
    project_id: str
    dataset_id: str
    table_id: str

class BigQueryRequest(BaseModel):
    sql_query: str
    original_query: Optional[str] = None
    query_description: Optional[str] = None

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

@app.get('/api/bigquery/connections')
async def get_bigquery_connections():
    try:
        bq_client = initialize_bigquery()
        projects = list(bq_client.list_projects())
        project_ids = [project.project_id for project in projects]
        
        logger.info(f"Fetched {len(project_ids)} BigQuery projects")
        return project_ids
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery connections: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch BigQuery connections: {str(e)}")

@app.get('/api/bigquery/datasets')
async def get_bigquery_datasets():
    try:
        bq_client = initialize_bigquery()
        project_id = bq_client.project
        
        datasets = list(bq_client.list_datasets())
        dataset_ids = [f"{project_id}.{dataset.dataset_id}" for dataset in datasets]
        
        logger.info(f"Fetched {len(dataset_ids)} datasets for project {project_id}")
        return dataset_ids
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery datasets: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch BigQuery datasets: {str(e)}")

@app.get('/api/bigquery/tables')
async def get_bigquery_tables(dataset_id: str):
    try:
        if not dataset_id:
            raise HTTPException(status_code=400, detail="Dataset ID is required")
        
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
        return table_ids
    
    except Exception as e:
        logger.error(f"Error fetching BigQuery tables: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch BigQuery tables: {str(e)}")

@app.post('/gemini')
async def gemini_endpoint(request: GeminiRequest):
    try:
        logger.info(f"Gemini Endpoint - Received Request: {request}")

        if not all([request.query, request.table_name, request.project_id, request.dataset_id, request.table_id]):
            raise HTTPException(
                status_code=400,
                detail="All connection details and query are required"
            )

        # Retrieve schema for ONLY the selected table
        bq_client = initialize_bigquery()
        table_ref = f"{request.project_id}.{request.dataset_id}.{request.table_id}"
        table = bq_client.get_table(table_ref)
        
        # Create schema just for the selected table
        schema = {
            request.table_id: [(field.name, field.field_type) for field in table.schema]
        }

        # Format the schema string specifically for the selected table
        schema_string = f"Table: {request.table_name}\nColumns: {', '.join([f'{name} ({dtype})' for name, dtype in schema[request.table_id]])}"

        model = configure_gemini()

        # Generate SQL query dynamically
        prompt = f"""
        Convert the following natural language query into an SQL query. Use ONLY the columns from the selected table: {request.table_name}

        Dataset schema for selected table:
        {schema_string}

        User query: {request.query}

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
        if request.table_id.lower() not in query.lower():
            logger.error(f"Query does not match the selected table: {request.table_name}")
            raise HTTPException(
                status_code=400,
                detail=f"Query must be based on selected table: {request.table_name}. Please select the correct table or rephrase your query."
            )

        # Execute query
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        datetime_column = [col for col in df.columns if
    pd.api.types.is_datetime64_any_dtype(df[col])]
        df=df.dropna(subset=datetime_column)
        
        # If no data is returned
        if df.empty:
            raise HTTPException(
                status_code=404,
                detail="No data found matching the query for the selected table."
            )

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

        return {
            'sql_query': query,
            'original_query': request.query,
            'query_description': result_description,
            'table_reference': request.table_name
        }
    
    except Exception as e:
        logger.error(f"Gemini Endpoint Error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error occurred during query processing: {str(e)}"
        )

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

@app.post('/api/bigquery')
async def bigquery_endpoint(request: BigQueryRequest):
    try:
        logger.info(f"BigQuery Endpoint - Received Request: {request}")

        if not request.sql_query:
            raise HTTPException(status_code=400, detail="No SQL query provided")

        bq_client = initialize_bigquery()
        
        logger.info(f"Executing SQL Query: {request.sql_query}")
        query_job = bq_client.query(request.sql_query)
        
        df = query_job.to_dataframe()
        
        # Handle datetime columns
        datetime_columns = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
        
        # Drop rows with NaT values in datetime columns if they exist
        if datetime_columns:
            df = df.dropna(subset=datetime_columns)
        
        logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

        if df.empty:
            return {
                'error': True,
                'message': 'No data found for the query',
                'data': [],
                'columns': [],
                'chart_type': None
            }

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
        Question: {request.original_query}
        SQL Query: {request.sql_query}
        SQL Result: Describe what the result dataframe represents and not the sql query itself, key metrics, and any important aggregations or patterns for eg: "based on the results, category a has more sales than category b".
        Provide your response in the format:
        Description: [Summary of what the SQL Result contains including key metrics and patterns]
        """
        description_response = model.generate_content([description_prompt])
        data_preview_description = description_response.text.strip()

        viz_prompt = f"""
        You are an AI assistant that recommends appropriate data visualizations.
        Question: {request.original_query}
        SQL Query: {request.sql_query}
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
            'query_description': request.query_description
        }

        logger.info("BigQuery Endpoint - Response Prepared")
        return response_data
    
    except Exception as e:
        logger.error(f"BigQuery Endpoint Error: {e}")
        logger.error(traceback.format_exc())
    raise HTTPException(
            status_code=500,
            detail={
                'error': 'Internal server error',
                'details': str(e),
                'traceback': traceback.format_exc()
            }
        )

# Cloud Function entry point
@functions_framework.http
def main(request):
    """HTTP Cloud Function entry point."""
    return app(request)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)