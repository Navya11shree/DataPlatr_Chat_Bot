
import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from google.cloud import bigquery

app = Flask(__name__)
CORS(app)

# Configure credentials (these should be set as environment variables in production)
BIGQUERY_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-bigquery.json"
GEMINI_CREDENTIALS = "E:\dataplatr_chatbot\datagpt-gemini.json"

# Logging configuration
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Gemini Configuration
def configure_gemini():
    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GEMINI_CREDENTIALS
        genai.configure()
        
        return genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config={
                "temperature": 0.4,
                "top_p": 1,
                "top_k": 32,
                "max_output_tokens": 4096,
            }
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

@app.route('/gemini', methods=['POST'])
def gemini_endpoint():
    try:
        # Log incoming request details
        logger.info(f"Gemini Endpoint - Received Request: {request.json}")

        data = request.json
        user_query = data.get('query', '')

        # Validate input
        if not user_query:
            return jsonify({'error': 'No query provided'}), 400

        # Configure Gemini
        model = configure_gemini()

        # Generate SQL query
        prompt = f"Convert this to SQL: {user_query} for the table `dataplatr-sandbox.EdwBI.Accounting_GLJournalDetails`"
        response = model.generate_content([prompt])
        query = response.text.strip().replace("```sql", "").replace("```", "").strip()

        # Log generated query
        logger.info(f"Generated SQL Query: {query}")

        return jsonify({
            'sql_query': query,
            'original_query': user_query
        })
    
    except Exception as e:
        # Log full error details
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
        # Log incoming request details
        logger.info(f"BigQuery Endpoint - Received Request: {request.json}")

        data = request.json
        
        # Validate input
        sql_query = data.get('sql_query', '')
        user_query = data.get('original_query', '')

        if not sql_query:
            return jsonify({'error': 'No SQL query provided'}), 400

        # Initialize BigQuery client
        bq_client = initialize_bigquery()
        
        # Execute query
        logger.info(f"Executing SQL Query: {sql_query}")
        query_job = bq_client.query(sql_query)
        
        # Fetch results
        df = query_job.to_dataframe()
        logger.info(f"Query Results - Rows: {len(df)}, Columns: {list(df.columns)}")

        # If dataframe is empty, return early
        if df.empty:
            return jsonify({
                'data': [],
                'columns': [],
                'chart_type': None,
                'llm_recommendation': 'No data found for the query.'
            }), 200

        # Recommend Visualization
        model = configure_gemini()
        viz_prompt = f"""
        You are an AI assistant that recommends appropriate data visualizations.
        Question: {user_query}
        SQL Query: {sql_query}
        SQL Result: {df.head(5).to_json()}
        Provide your response in the format:
        Recommended Visualization: [Chart type or "none"]
        Reason: [Brief explanation for your recommendation]
        """
        
        # Generate visualization recommendation
        logger.info("Generating visualization recommendation")
        viz_response = model.generate_content([viz_prompt])

        # Extract chart type
        chart_type = None
        if "Recommended Visualization:" in viz_response.text:
            chart_type = viz_response.text.split("Recommended Visualization:")[1].split("\n")[0].strip().lower()
            
            # Normalize chart type
            valid_chart_types = ["bar", "line", "scatter", "pie"]
            if chart_type and " " in chart_type:
                chart_type = chart_type.split()[0]
            
            if chart_type not in valid_chart_types:
                chart_type = None

        # Prepare response
        response_data = {
            'data': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'chart_type': chart_type,
            'llm_recommendation': viz_response.text
        }

        logger.info("BigQuery Endpoint - Response Prepared")
        return jsonify(response_data)
    
    except Exception as e:
        # Log full error details
        logger.error(f"BigQuery Endpoint Error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)