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

def generate_quiz(context):
    prompt = f"""Generate 3 multiple-choice questions based on the following content:
    {context}
    
    Format:
    1. Question: <question>
       Options: A) <option1> B) <option2> C) <option3> D) <option4>
       Correct Answer: <correct_option>"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Quiz Generation Error: {str(e)}")
        return "Error generating quiz."