from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import logging
import os
from werkzeug.utils import secure_filename
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Corrected Imports ---
from context_processor import process_uploaded_file, get_youtube_transcript
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from summarization import summarize_content
from ask_question import process_question
from quiz_generation import generate_full_quiz, analyze_quiz_results

app = Flask(__name__)
CORS(app)

# Define upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# In-memory storage for contexts and embeddings
processed_contexts = {} 
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

@app.route('/')
def home():
    return "Welcome to the Learning Platform API!"

@app.route('/process-context', methods=['POST'])
def process_context():
    logger = logging.getLogger(__name__)
    try:
        context_id = str(uuid.uuid4())
        file = request.files.get('file')
        youtube_url = request.form.get('youtubeUrl')
        
        docs = []
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            docs = process_uploaded_file(file_path)
            os.remove(file_path)

        elif youtube_url:
            # --- SIMPLIFIED LOGIC ---
            # This function now correctly returns a list of Document objects
            docs = get_youtube_transcript(youtube_url)
        
        if not docs:
            return jsonify({"error": "Failed to process the provided context."}), 400

        vector_store = FAISS.from_documents(docs, embeddings)
        processed_contexts[context_id] = vector_store
        logger.info(f"Context processed and stored with ID: {context_id}")

        return jsonify({"context_id": context_id, "message": "Context processed successfully."})

    except Exception as e:
        logger.error(f"CRITICAL ERROR in /process-context: {str(e)}")
        logger.error(f"Full Traceback:\n{traceback.format_exc()}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/ask', methods=['POST'])
def handle_ask_question():
    logger = logging.getLogger(__name__)
    try:
        data = request.get_json()
        query = data.get("query", "")
        user_level = data.get("user_level", "beginner")
        context_id = data.get("context_id")
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        if context_id and context_id in processed_contexts:
            vector_store = processed_contexts[context_id]
            retriever = vector_store.as_retriever()
            relevant_docs = retriever.invoke(query)
            rag_context = "\n\n".join([doc.page_content for doc in relevant_docs])
            result = process_question(query, user_level, context=rag_context)
        else:
            result = process_question(query, user_level)

        if not result["success"]:
            return jsonify({"error": result["answer"]}), 500
            
        return jsonify({"answer": result["answer"]})
            
    except Exception as e:
        logger.error(f"Ask question error: {str(e)}")
        logger.error(f"Full Traceback: {traceback.format_exc()}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    logger = logging.getLogger(__name__)
    try:
        data = request.get_json()
        context_id = data.get("context_id")
        manual_context = data.get("context", "")
        num_questions = data.get("num_questions", 5)

        final_context = ""
        if context_id and context_id in processed_contexts:
            vector_store = processed_contexts[context_id]
            retriever = vector_store.as_retriever(search_kwargs={"k": 10})
            docs = retriever.invoke("Create a quiz from this content.")
            final_context = "\n\n".join([doc.page_content for doc in docs])
        elif manual_context:
            final_context = manual_context
        
        if not final_context:
            return jsonify({"error": "No context was provided to generate the quiz."}), 400
        
        result = generate_full_quiz(final_context, num_questions)
        
        if result["success"]:
            return jsonify({"quiz": result["quiz"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        logger.error(f"Error in generate_quiz_endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-quiz', methods=['POST'])
def analyze_quiz_endpoint():
    logger = logging.getLogger(__name__)
    try:
        data = request.get_json()
        context_id = data.get('context_id')
        quiz_questions = data.get('quiz_questions', [])
        user_answers = data.get('user_answers', {})

        if not context_id or context_id not in processed_contexts:
            return jsonify({"error": "Invalid or missing context for analysis."}), 400
        
        vector_store = processed_contexts[context_id]
        retriever = vector_store.as_retriever(search_kwargs={"k": 15})
        docs = retriever.invoke("Summarize the key topics of this document.")
        full_context = "\n\n".join([doc.page_content for doc in docs])

        result = analyze_quiz_results(full_context, quiz_questions, user_answers)
        
        if result["success"]:
            return jsonify({"analysis": result["analysis"]})
        else:
            return jsonify({"error": result["error"]}), 500

    except Exception as e:
        logger.error(f"Error in /analyze-quiz: {str(e)}")
        return jsonify({"error": "An internal server has occurred"}), 500

@app.route('/summarize', methods=['POST'])
def handle_summarization():
    logger = logging.getLogger(__name__)
    try:
        data = request.get_json()
        context_id = data.get("context_id")
        manual_context = data.get("context", "")
        user_level = data.get("user_level", "beginner")

        final_context = ""
        if context_id and context_id in processed_contexts:
            vector_store = processed_contexts[context_id]
            retriever = vector_store.as_retriever(search_kwargs={"k": 5})
            docs = retriever.invoke("Summarize this document.")
            final_context = "\n\n".join([doc.page_content for doc in docs])
        elif manual_context:
            final_context = manual_context

        if not final_context:
            return jsonify({"error": "No content provided for summarization"}), 400
            
        result = summarize_content(final_context, user_level)
        
        if result["success"]:
            return jsonify({"summary": result["summary"]})
        else:
            return jsonify({"error": result["summary"]}), 500
            
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)

