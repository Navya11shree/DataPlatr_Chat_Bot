# # #backend DataGPT with no  sidebar connection drop down 
# # import os
# # import traceback
# # from flask import Flask, request, jsonify
# # from flask_cors import CORS
# # import google.generativeai as genai
# # from google.cloud import bigquery
# # import plotly.express as px
# # import pandas as pd
# # import json
# # import logging

# # app = Flask(__name__)
# # CORS(app)

# # # Configure credentials (these should be set as environment variables in production)
# # BIGQUERY_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-bigquery.json"
# # GEMINI_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-gemini.json"

# # # Logging configuration
# # logging.basicConfig(level=logging.DEBUG)
# # logger = logging.getLogger(__name__)

# # # Generation configuration for Gemini
# # generation_config = {
# #     "temperature": 0.4,
# #     "top_p": 1,
# #     "top_k": 32,
# #     "max_output_tokens": 4096,
# # }

# # # Gemini Configuration
# # def configure_gemini():
# #     try:
# #         os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GEMINI_CREDENTIALS
# #         genai.configure()
        
# #         return genai.GenerativeModel(
# #             model_name="gemini-pro",
# #             generation_config=generation_config
# #         )
# #     except Exception as e:
# #         logger.error(f"Gemini configuration error: {e}")
# #         logger.error(traceback.format_exc())
# #         raise

# # # BigQuery Initialization
# # def initialize_bigquery():
# #     try:
# #         os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = BIGQUERY_CREDENTIALS
# #         return bigquery.Client()
# #     except Exception as e:
# #         logger.error(f"BigQuery initialization error: {e}")
# #         logger.error(traceback.format_exc())
# #         raise

# # @app.route('/gemini', methods=['POST'])
# # def gemini_endpoint():
# #     try:
# #         # Log incoming request details
# #         logger.info(f"Gemini Endpoint - Received Request: {request.json}")

# #         data = request.json
# #         user_query = data.get('query', '')

# #         # Validate input
# #         if not user_query:
# #             return jsonify({'error': 'No query provided'}), 400

# #         # Configure Gemini
# #         model = configure_gemini()

# #         # Generate SQL query
# #         prompt = f"Convert this natural language query to SQL for the table `dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails`: {user_query}\n\nProvide ONLY the SQL query without any additional explanation."
# #         response = model.generate_content([prompt])
# #         query = response.text.strip().replace("```sql", "").replace("```", "").strip()

# #         # Generate Results Description
# #         description_prompt = f"""
# #         You are an AI assistant that summarizes query results in plain English.
# #         The result contains the following columns.
# #         Question: {user_query}
# #         SQL Query: {query}
# #         SQL Result: Describe what the data represents, key metrics, and any important aggregations or patterns.
# #         Provide your response in the format:
# #         Description: [Summary of what the data contains]
# #         """
# #         description_response = model.generate_content([description_prompt])
# #         result_description = description_response.text.strip()

# #         # Log generated query
# #         logger.info(f"Generated SQL Query: {query}")

# #         return jsonify({
# #             'sql_query': query,
# #             'original_query': user_query,
# #             'query_description': result_description
# #         })
    
# #     except Exception as e:
# #         # Log full error details
# #         logger.error(f"Gemini Endpoint Error: {e}")
# #         logger.error(traceback.format_exc())
# #         return jsonify({
# #             'error': 'Internal server error',
# #             'details': str(e),
# #             'traceback': traceback.format_exc()
# #         }), 500

# # @app.route('/api/bigquery', methods=['POST'])
# # def bigquery_endpoint():
# #     try:
# #         # Log incoming request details
# #         logger.info(f"BigQuery Endpoint - Received Request: {request.json}")

# #         data = request.json
        
# #         # Validate input
# #         sql_query = data.get('sql_query', '')
# #         user_query = data.get('original_query', '')
# #         query_description = data.get('query_description', '')

# #         if not sql_query:
# #             return jsonify({'error': 'No SQL query provided'}), 400

# #         # Initialize BigQuery client
# #         bq_client = initialize_bigquery()
        
# #         # Execute query
# #         logger.info(f"Executing SQL Query: {sql_query}")
# #         query_job = bq_client.query(sql_query)
        
# #         # Fetch results
# #         df = query_job.to_dataframe()
# #         logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

# #         # If dataframe is empty, return early
# #         if df.empty:
# #             return jsonify({
# #                 'data': [],
# #                 'columns': [],
# #                 'chart_type': None,
# #                 'llm_recommendation': 'No data found for the query.'
# #             }), 200

# #         # Initialize Gemini model
# #         model = configure_gemini()

# #         # Generate Data Description
# #         description_prompt = f"""
# #         You are an AI assistant that summarizes query results in plain English.
# #         The result contains the following columns:{', '.join(df.columns.tolist())}.
# #         For the column {df.columns[0]}, here are some sample values: {', '.join(df[df.columns[0]].unique()[:4])}.
# #         For the column {df.columns[1]}, here are some sample values: {', '.join(map(str, df[df.columns[1]].unique()[:4]))}.
# #         Question: {user_query}
# #         SQL Query: {sql_query}
# #         SQL Result: Describe what the data represents, key metrics, and any important aggregations or patterns.
# #         Provide your response in the format:
# #         Description: [Summary of what the data contains]
# #         """
# #         description_response = model.generate_content([description_prompt])
# #         data_preview_description = description_response.text.strip()

# #         # Recommend Visualization
# #         viz_prompt = f"""
# #         You are an AI assistant that recommends appropriate data visualizations.
# #         Question: {user_query}
# #         SQL Query: {sql_query}
# #         Result Description: {data_preview_description}
# #         Provide your response in the format:
# #         Recommended Visualization: [Chart type or "none"]
# #         """
# #         viz_response = model.generate_content([viz_prompt])

# #         # Extract chart type
# #         chart_type = None
# #         if "Recommended Visualization:" in viz_response.text:
# #             chart_type = viz_response.text.split("Recommended Visualization:")[1].split("\n")[0].strip().lower()
            
# #             # Normalize chart type
# #             valid_chart_types = ["bar", "line", "scatter", "pie"]
# #             if chart_type and " " in chart_type:
# #                 chart_type = chart_type.split()[0]
            
# #             if chart_type not in valid_chart_types:
# #                 chart_type = None

# #         # Generate chart description
# #         chart_description_prompt = f"""
# #         You are an AI assistant that describes charts in simple terms.
# #         Chart Type: {chart_type}
# #         Data Description: {data_preview_description}
# #         Describe what the chart illustrates and any key insights.
# #         Provide your response in the format:
# #         Chart Description: [Explanation of what the chart illustrates]
# #         """
# #         chart_description_response = model.generate_content([chart_description_prompt])
# #         chart_description = chart_description_response.text.strip()

# #         # Prepare response
# #         response_data = {
# #             'data': df.to_dict(orient='records'),
# #             'columns': df.columns.tolist(),
# #             'chart_type': chart_type,
# #             'llm_recommendation': viz_response.text,
# #             'data_preview_description': data_preview_description,
# #             'chart_description': chart_description,
# #             'query_description': query_description
# #         }

# #         logger.info("BigQuery Endpoint - Response Prepared")
# #         return jsonify(response_data)
    
# #     except Exception as e:
# #         # Log full error details
# #         logger.error(f"BigQuery Endpoint Error: {e}")
# #         logger.error(traceback.format_exc())
# #         return jsonify({
# #             'error': 'Internal server error',
# #             'details': str(e),
# #             'traceback': traceback.format_exc()
# #         }), 500
        

# # if __name__ == '__main__':
# #     app.run(debug=True, port=8080)





# #DataGPT with sidebar connection drop down code
# import os
# import traceback
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import google.generativeai as genai
# from google.cloud import bigquery
# import plotly.express as px
# import pandas as pd
# import json
# import logging

# app = Flask(__name__)
# CORS(app)

# # Configure credentials (these should be set as environment variables in production)
# BIGQUERY_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-bigquery.json"
# GEMINI_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-gemini.json"

# # Logging configuration
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# # Generation configuration for Gemini
# generation_config = {
#     "temperature": 0.4,
#     "top_p": 1,
#     "top_k": 32,
#     "max_output_tokens": 4096,
# }

# # Gemini Configuration
# def configure_gemini():
#     try:
#         os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GEMINI_CREDENTIALS
#         genai.configure()
        
#         return genai.GenerativeModel(
#             model_name="gemini-pro",
#             generation_config=generation_config
#         )
#     except Exception as e:
#         logger.error(f"Gemini configuration error: {e}")
#         logger.error(traceback.format_exc())
#         raise

# # BigQuery Initialization
# def initialize_bigquery():
#     try:
#         os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = BIGQUERY_CREDENTIALS
#         return bigquery.Client()
#     except Exception as e:
#         logger.error(f"BigQuery initialization error: {e}")
#         logger.error(traceback.format_exc())
#         raise

# # New BigQuery Connection Detail Routes
# @app.route('/api/bigquery/connections', methods=['GET'])
# def get_bigquery_connections():
#     try:
#         bq_client = initialize_bigquery()
#         projects = list(bq_client.list_projects())
#         project_ids = [project.project_id for project in projects]
        
#         logger.info(f"Fetched {len(project_ids)} BigQuery projects")
#         return jsonify(project_ids)
    
#     except Exception as e:
#         logger.error(f"Error fetching BigQuery connections: {e}")
#         logger.error(traceback.format_exc())
#         return jsonify({'error': 'Failed to fetch BigQuery connections', 'details': str(e)}), 500

# @app.route('/api/bigquery/datasets', methods=['GET'])
# def get_bigquery_datasets():
#     try:
#         bq_client = initialize_bigquery()
#         project_id = bq_client.project
        
#         datasets = list(bq_client.list_datasets())
#         dataset_ids = [f"{project_id}.{dataset.dataset_id}" for dataset in datasets]
        
#         logger.info(f"Fetched {len(dataset_ids)} datasets for project {project_id}")
#         return jsonify(dataset_ids)
    
#     except Exception as e:
#         logger.error(f"Error fetching BigQuery datasets: {e}")
#         logger.error(traceback.format_exc())
#         return jsonify({'error': 'Failed to fetch BigQuery datasets', 'details': str(e)}), 500

# @app.route('/api/bigquery/tables', methods=['GET'])
# def get_bigquery_tables():
#     try:
#         dataset_id = request.args.get('dataset_id')
        
#         if not dataset_id:
#             return jsonify({'error': 'Dataset ID is required'}), 400
        
#         bq_client = initialize_bigquery()
        
#         try:
#             project_id, dataset_name = dataset_id.split('.')
#         except ValueError:
#             project_id = bq_client.project
#             dataset_name = dataset_id
        
#         dataset_ref = bigquery.DatasetReference(project_id, dataset_name)
#         tables = list(bq_client.list_tables(dataset_ref))
#         table_ids = [table.table_id for table in tables]
        
#         logger.info(f"Fetched {len(table_ids)} tables for dataset {dataset_id}")
#         return jsonify(table_ids)
    
#     except Exception as e:
#         logger.error(f"Error fetching BigQuery tables: {e}")
#         logger.error(traceback.format_exc())
#         return jsonify({'error': 'Failed to fetch BigQuery tables', 'details': str(e)}), 500

# @app.route('/gemini', methods=['POST'])
# def gemini_endpoint():
#     try:
#         logger.info(f"Gemini Endpoint - Received Request: {request.json}")

#         data = request.json
#         user_query = data.get('query', '')

#         if not user_query:
#             return jsonify({'error': 'No query provided'}), 400

#         model = configure_gemini()

#         prompt = f"Convert this natural language query to SQL for the table `dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails`: {user_query}\n\nProvide ONLY the SQL query without any additional explanation."
#         response = model.generate_content([prompt])
#         query = response.text.strip().replace("```sql", "").replace("```", "").strip()

#         description_prompt = f"""
#         You are an AI assistant that summarizes query results in plain English.
#         The result contains the following columns.
#         Question: {user_query}
#         SQL Query: {query}
#         SQL Result: Describe what the data represents, key metrics, and any important aggregations or patterns.
#         Provide your response in the format:
#         Description: [Summary of what the data contains]
#         """
#         description_response = model.generate_content([description_prompt])
#         result_description = description_response.text.strip()

#         logger.info(f"Generated SQL Query: {query}")

#         return jsonify({
#             'sql_query': query,
#             'original_query': user_query,
#             'query_description': result_description
#         })
    
#     except Exception as e:
#         logger.error(f"Gemini Endpoint Error: {e}")
#         logger.error(traceback.format_exc())
#         return jsonify({
#             'error': 'Internal server error',
#             'details': str(e),
#             'traceback': traceback.format_exc()
#         }), 500

# @app.route('/api/bigquery', methods=['POST'])
# def bigquery_endpoint():
#     try:
#         logger.info(f"BigQuery Endpoint - Received Request: {request.json}")

#         data = request.json
        
#         sql_query = data.get('sql_query', '')
#         user_query = data.get('original_query', '')
#         query_description = data.get('query_description', '')

#         if not sql_query:
#             return jsonify({'error': 'No SQL query provided'}), 400

#         bq_client = initialize_bigquery()
        
#         logger.info(f"Executing SQL Query: {sql_query}")
#         query_job = bq_client.query(sql_query)
        
#         df = query_job.to_dataframe()
#         logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

#         if df.empty:
#             return jsonify({
#                 'data': [],
#                 'columns': [],
#                 'chart_type': None,
#                 'llm_recommendation': 'No data found for the query.'
#             }), 200

#         model = configure_gemini()

#         description_prompt = f"""
#         You are an AI assistant that summarizes query results in plain English.
#         The result contains the following columns:{', '.join(df.columns.tolist())}.
#         For the column {df.columns[0]}, here are some sample values: {', '.join(df[df.columns[0]].unique()[:4])}.
#         For the column {df.columns[1]}, here are some sample values: {', '.join(map(str, df[df.columns[1]].unique()[:4]))}.
#         Question: {user_query}
#         SQL Query: {sql_query}
#         SQL Result: Describe what the data represents, key metrics, and any important aggregations or patterns.
#         Provide your response in the format:
#         Description: [Summary of what the data contains]
#         """
#         description_response = model.generate_content([description_prompt])
#         data_preview_description = description_response.text.strip()

#         viz_prompt = f"""
#         You are an AI assistant that recommends appropriate data visualizations.
#         Question: {user_query}
#         SQL Query: {sql_query}
#         Result Description: {data_preview_description}
#         Provide your response in the format:
#         Recommended Visualization: [Chart type or "none"]
#         """
#         viz_response = model.generate_content([viz_prompt])

#         chart_type = None
#         if "Recommended Visualization:" in viz_response.text:
#             chart_type = viz_response.text.split("Recommended Visualization:")[1].split("\n")[0].strip().lower()
            
#             valid_chart_types = ["bar", "line", "scatter", "pie"]
#             if chart_type and " " in chart_type:
#                 chart_type = chart_type.split()[0]
            
#             if chart_type not in valid_chart_types:
#                 chart_type = None

#         chart_description_prompt = f"""
#         You are an AI assistant that describes charts in simple terms.
#         Chart Type: {chart_type}
#         Data Description: {data_preview_description}
#         Describe what the chart illustrates and any key insights.
#         Provide your response in the format:
#         Chart Description: [Explanation of what the chart illustrates]
#         """
#         chart_description_response = model.generate_content([chart_description_prompt])
#         chart_description = chart_description_response.text.strip()

#         response_data = {
#             'data': df.to_dict(orient='records'),
#             'columns': df.columns.tolist(),
#             'chart_type': chart_type,
#             'llm_recommendation': viz_response.text,
#             'data_preview_description': data_preview_description,
#             'chart_description': chart_description,
#             'query_description': query_description
#         }

#         logger.info("BigQuery Endpoint - Response Prepared")
#         return jsonify(response_data)
    
#     except Exception as e:
#         logger.error(f"BigQuery Endpoint Error: {e}")
#         logger.error(traceback.format_exc())
#         return jsonify({
#             'error': 'Internal server error',
#             'details': str(e),
#             'traceback': traceback.format_exc()
#         }), 500
        

# if __name__ == '__main__':
#     app.run(debug=True, port=8080)



#backend code for connection with only one dataset , for other dataset it doesnt work
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
        project_id = data.get('project_id')
        dataset_id = data.get('dataset_id')
        table_id = data.get('table_id')

        if not user_query:
            return jsonify({'error': 'No query provided'}), 400

        model = configure_gemini()

        # Dynamically construct the table reference
        full_table_ref = f"{project_id}.{dataset_id}.{table_id}"

        prompt = f"""Convert this natural language query to SQL for the table `{full_table_ref}`: {user_query}

Constraints:
1. Use only columns from the specified table
2. Provide a valid SQL query that can be directly executed in BigQuery
3. If the query cannot be fully answered by the given table, explain why

Provide ONLY the SQL query without any additional explanation."""
        
        response = model.generate_content([prompt])
        query = response.text.strip().replace("```sql", "").replace("```", "").strip()

        description_prompt = f"""
        You are an AI assistant that summarizes query results in plain English.
        The query is for the table {full_table_ref}
        Question: {user_query}
        SQL Query: {query}
        Provide a detailed description of what insights this query might reveal.
        """
        description_response = model.generate_content([description_prompt])
        result_description = description_response.text.strip()

        logger.info(f"Generated SQL Query: {query}")

        return jsonify({
            'sql_query': query,
            'original_query': user_query,
            'query_description': result_description,
            'table_reference': full_table_ref
        })
    
    except Exception as e:
        logger.error(f"Gemini Endpoint Error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/bigquery', methods=['POST'])
def bigquery_endpoint():
    try:
        logger.info(f"BigQuery Endpoint - Received Request: {request.json}")

        data = request.json
        
        sql_query = data.get('sql_query', '')
        user_query = data.get('original_query', '')
        query_description = data.get('query_description', '')
        table_reference = data.get('table_reference', '')

        if not sql_query:
            return jsonify({'error': 'No SQL query provided'}), 400

        bq_client = initialize_bigquery()
        
        logger.info(f"Executing SQL Query: {sql_query}")
        query_job = bq_client.query(sql_query)
        
        df = query_job.to_dataframe()
        logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

        if df.empty:
            return jsonify({
                'data': [],
                'columns': [],
                'chart_type': None,
                'llm_recommendation': 'No data found for the query.'
            }), 200

        model = configure_gemini()

        description_prompt = f"""
        You are an AI assistant that summarizes query results in plain English.
        The result contains the following columns:{', '.join(df.columns.tolist())}.
        For the column {df.columns[0]}, here are some sample values: {', '.join(df[df.columns[0]].unique()[:4])}.
        For the column {df.columns[1]}, here are some sample values: {', '.join(map(str, df[df.columns[1]].unique()[:4]))}.
        Question: {user_query}
        SQL Query: {sql_query}
        SQL Result: Describe what the data represents, key metrics, and any important aggregations or patterns.
        Provide your response in the format:
        Description: [Summary of what the data contains]
        """
        description_response = model.generate_content([description_prompt])
        data_preview_description = description_response.text.strip()

        viz_prompt = f"""
        You are an AI assistant that recommends appropriate data visualizations.
        Question: {user_query}
        SQL Query: {sql_query}
        Result Description: {data_preview_description}
        Provide your response in the format:
        Recommended Visualization: [Chart type or "none"]
        """
        viz_response = model.generate_content([viz_prompt])

        chart_type = None
        if "Recommended Visualization:" in viz_response.text:
            chart_type = viz_response.text.split("Recommended Visualization:")[1].split("\n")[0].strip().lower()
            
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

      
        response_data = {
            'data': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'chart_type': chart_type,
            'llm_recommendation': viz_response.text,
            'data_preview_description': data_preview_description,
            'chart_description': chart_description,
            'query_description': query_description,
            'table_reference': table_reference
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