import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-pro-exp-02-05')

def generate_answer(query, user_level="beginner"):
    """
    Generates an answer to a user's question based on their learning level.
    
    Args:
        query (str): The question from the user
        user_level (str): The user's learning level (beginner, intermediate, advanced)
        
    Returns:
        str: The generated answer or error message
    """
    if not query:
        logger.warning("Empty query provided to generate_answer")
        return "No question provided"

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

def process_question(query, user_level="beginner"):
    """
    Process a question with error handling and logging.
    
    Returns dict with:
    - success: boolean
    - answer: string (or error message if success=False)
    """
    try:
        if not query:
            return {"success": False, "answer": "No question provided"}
            
        answer = generate_answer(query, user_level)
        return {"success": True, "answer": answer}
    except Exception as e:
        logger.error(f"Error in process_question: {str(e)}")
        return {"success": False, "answer": f"Error: {str(e)}"}