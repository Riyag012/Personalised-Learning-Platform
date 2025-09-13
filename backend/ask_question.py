import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

# --- SOLUTION: Add logger setup to this file ---
# This creates a logger specific to this module.
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
# --- END OF SOLUTION ---

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
# Using a model that is good for RAG and general queries
model = genai.GenerativeModel('gemini-1.5-flash') 

def generate_answer(query, user_level="beginner", context=None):
    """
    Generates an answer to a user's question, using provided context if available.
    """
    if not query:
        logger.warning("Empty query provided to generate_answer")
        return "No question provided"

    if context:
        # RAG-specific prompt
        prompt = f"""You are a helpful assistant. Answer the following question based ONLY on the provided context.
        If the answer is not found in the context, say "I could not find the answer in the provided document."

        Context:
        {context}
        
        Question:
        {query}
        """
    else:
        # Original general-knowledge prompt
        prompt = f"""Answer this question for a {user_level} learner:
        {query}
        
        Requirements:
        - Use simple language and basic concepts for beginners
        - Include more technical details for intermediate users
        - Provide comprehensive explanations with advanced terminology for advanced users
        - Structure the answer with clear sections if needed
        - Include examples where appropriate
        - Keep the answer concise but thorough"""
    
    try:
        logger.debug(f"Sending query to model: {query[:100]}...")
        response = model.generate_content(prompt)
        logger.debug("Response received from model")
        return response.text
    except Exception as e:
        logger.error(f"Error generating answer: {str(e)}")
        return f"Error generating answer: {str(e)}"

def process_question(query, user_level="beginner", context=None):
    """
    Process a question with error handling and logging, passing context if it exists.
    """
    try:
        if not query:
            return {"success": False, "answer": "No question provided"}
            
        answer = generate_answer(query, user_level, context=context)
        return {"success": True, "answer": answer}
    except Exception as e:
        logger.error(f"Error in process_question: {str(e)}")
        return {"success": False, "answer": f"Error: {str(e)}"}