from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

try:
    from quiz_generation import generate_quiz_question
    # Import these if needed
    # from rag import load_and_process_documents, initialize_pinecone, create_qa_chain
    # from summarization import summarize_content
    # from langchain_community.embeddings import HuggingFaceEmbeddings
except Exception as e:
    logger.error(f"Import error: {str(e)}")
    raise

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store for keeping track of quiz sessions
quiz_sessions = {}

@app.route('/')
def home():
    return "Welcome to the Quiz API! Use /generate-quiz to start."

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    try:
        data = request.get_json()
        logger.debug(f"Received request data: {data}")
        
        context = data.get("context", "")
        session_id = data.get("session_id")
        
        if not context:
            logger.warning("No context provided")
            return jsonify({"error": "Context is required"}), 400
        
        # Create a new session if one doesn't exist
        if not session_id or session_id not in quiz_sessions:
            session_id = str(uuid.uuid4())
            logger.info(f"Creating new session: {session_id}")
            
            # Set a fixed total number of questions when starting the quiz
            total_questions = 5  # You can change this to your desired number
            
            quiz_sessions[session_id] = {
                "context": context,
                "questions": [],
                "current_index": 0,
                "total_questions": total_questions
            }
        else:
            logger.info(f"Using existing session: {session_id}")
        
        # Get the session
        session = quiz_sessions[session_id]
        
        # Generate a new question if needed
        if session["current_index"] >= len(session["questions"]):
            logger.info("Generating new question")
            # Only generate new questions if we haven't reached the total
            if len(session["questions"]) < session["total_questions"]:
                new_question = generate_quiz_question(context, session["questions"])
                if new_question:
                    session["questions"].append(new_question)
                    logger.info(f"Added new question: {new_question}")
                else:
                    logger.error("Failed to generate question")
                    return jsonify({"error": "Failed to generate question"}), 500
            else:
                # If we've reached the end, return a completion message
                return jsonify({
                    "completed": True,
                    "message": "Quiz completed! You've answered all questions.",
                    "session_id": session_id,
                    "question_number": session["current_index"],
                    "total_questions": session["total_questions"]
                })
        
        # Get the current question
        current_question = session["questions"][session["current_index"]]
        session["current_index"] += 1
        
        logger.info(f"Returning question {session['current_index']} of {session['total_questions']}")
        
        # Return the question and session ID
        return jsonify({
            "question": current_question["question"],
            "options": current_question["options"],
            "correct_answer": current_question["correct_answer"],
            "session_id": session_id,
            "question_number": session["current_index"],
            "total_questions": session["total_questions"]
        })
    except Exception as e:
        logger.error(f"Error in generate_quiz: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

# Add to imports at the top
from summarization import summarize_content

# Add this route definition
@app.route('/summarize', methods=['POST'])
def handle_summarization():
    try:
        data = request.get_json()
        logger.debug(f"Summarization request data: {data}")
        
        context = data.get("context", "")
        user_level = data.get("user_level", "beginner")
        
        if not context:
            logger.warning("No context provided for summarization")
            return jsonify({"error": "Context is required"}), 400
            
        result = summarize_content(context, user_level)
        
        if result["success"]:
            return jsonify({"summary": result["summary"]})
        else:
            return jsonify({"error": result["summary"]}), 500
            
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add to imports at the top
from summarization import summarize_content
from quiz_generation import generate_answer  # Assuming you have this function

# Update imports at the top of your main.py file:
from summarization import summarize_content
from ask_question import process_question  # Changed from generate_answer

# Replace your existing /ask route with this:
@app.route('/ask', methods=['POST'])
def handle_ask_question():
    try:
        data = request.get_json()
        logger.debug(f"Ask question request data: {data}")
        
        query = data.get("query", "")
        user_level = data.get("user_level", "beginner")
        
        if not query:
            logger.warning("No query provided")
            return jsonify({"error": "Query is required"}), 400
            
        # Process the question and get the answer
        result = process_question(query, user_level)
        
        if not result["success"]:
            logger.error(f"Question processing failed: {result['answer']}")
            return jsonify({"error": result["answer"]}), 500
            
        return jsonify({
            "answer": result["answer"]
        })
            
    except Exception as e:
        logger.error(f"Ask question error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)