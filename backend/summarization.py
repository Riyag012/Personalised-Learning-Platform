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
model = genai.GenerativeModel('gemini-2.0-pro-exp-02-05')

def summarize_content(context, user_level):
    prompt = f"""Summarize the following content for a {user_level} learner:
    {context}
    
    Summary:"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Summarization Error: {str(e)}")
        return "Error generating summary."