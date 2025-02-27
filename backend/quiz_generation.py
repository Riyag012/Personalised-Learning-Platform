import google.generativeai as genai
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-pro-exp-02-05')

def generate_quiz_question(context, previous_questions=None):
    """Generate a single question based on content, avoiding duplicate questions"""
    
    previous_questions_text = ""
    if previous_questions and len(previous_questions) > 0:
        previous_questions_text = "Previous questions (do not repeat these):\n" + "\n".join([q["question"] for q in previous_questions])
    
    prompt = f"""Generate 1 multiple-choice question based on the following content: 
    
{context}

{previous_questions_text}

Format the response as a JSON object with the following keys:
- "question": The question text.
- "options": A list of 4 options (A, B, C, D).
- "correct_answer": The correct option.

Example:
{{
    "question": "What is deep learning?",
    "options": [
        "A) A type of machine learning",
        "B) A programming language",
        "C) A database",
        "D) A type of hardware"
    ],
    "correct_answer": "A) A type of machine learning"
}}

Now generate 1 new question based on this content. Return only valid JSON.
"""
    
    try:
        print("Sending prompt to Gemini API for single question")
        response = model.generate_content(prompt)
        print("Raw Gemini API response:", response.text)
        
        # Try to extract JSON from the response text
        text = response.text
        
        # Handle case where the response might contain text before or after the JSON
        try:
            # Try to find JSON object
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                question = json.loads(json_str)
            else:
                # Alternative extraction method
                question = json.loads(text)
        except json.JSONDecodeError:
            # Try using a more relaxed parsing approach
            import re
            json_pattern = r'\{[\s\S]*\}'
            match = re.search(json_pattern, text)
            if match:
                json_str = match.group(0)
                question = json.loads(json_str)
            else:
                raise ValueError("Could not extract valid JSON from the response")
        
        # Validate that the question has all required fields
        if not all(key in question for key in ["question", "options", "correct_answer"]):
            raise ValueError("Response is missing required fields")
        
        # Validate that the correct_answer is in the options
        if question["correct_answer"] not in question["options"]:
            raise ValueError("Correct answer is not in the options list")
            
        return question
    except Exception as e:
        print(f"Quiz Question Generation Error: {str(e)}")
        # Return a fallback question in case of error
        return {
            "question": "What is the primary purpose of a quiz in an educational context?",
            "options": [
                "A) To assess knowledge retention",
                "B) To entertain students",
                "C) To take up class time",
                "D) To replace textbooks"
            ],
            "correct_answer": "A) To assess knowledge retention"
        }
    
def generate_answer(query):
    """
    Simulates generating an answer to a user's query.
    Replace this with actual logic (e.g., using a QA model).
    """
    # Example logic (replace with your actual implementation)
    return f"This is a sample answer for the query: {query}"