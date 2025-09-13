import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-pro')

def summarize_content(context, user_level):
    """
    Returns dict with:
    - success: boolean
    - summary: string (or error message if success=False)
    """
    if not context:
        return {"success": False, "summary": "No content provided"}

    prompt = f"""Summarize this for a {user_level} learner:
    {context}
    
    Requirements:
    - Use simple language for beginners
    - Include technical details for advanced
    - Keep under 200 words
    - Focus on key concepts"""
    
    try:
        response = model.generate_content(prompt)
        return {"success": True, "summary": response.text}
    except Exception as e:
        return {"success": False, "summary": f"Error: {str(e)}"}