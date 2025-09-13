import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import logging

# Add logger setup
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-pro')

def generate_full_quiz(context, num_questions=5):
    """Generate a full quiz with a specified number of questions in a single call."""
    
    if not context:
        raise ValueError("Context cannot be empty for quiz generation.")

    prompt = f"""Generate a multiple-choice quiz with exactly {num_questions} questions based on the following content.

Content:
{context}

Format the response as a single, valid JSON array where each object has the following keys:
- "question": The question text.
- "options": A list of 4 unique string options.
- "correct_answer": The correct option string, which must be one of the strings from the "options" list.

Example of the expected JSON array format:
[
  {{
    "question": "What is the primary function of a CPU?",
    "options": ["Store data long-term", "Execute instructions", "Display graphics", "Connect to the internet"],
    "correct_answer": "Execute instructions"
  }},
  {{
    "question": "Which of these is a type of RAM?",
    "options": ["DDR4", "SSD", "HDD", "USB"],
    "correct_answer": "DDR4"
  }}
]

Now, generate the quiz. Return only the valid JSON array and nothing else.
"""
    
    try:
        logger.info(f"Generating a quiz with {num_questions} questions.")
        response = model.generate_content(prompt)
        
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        quiz_data = json.loads(cleaned_text)

        if not isinstance(quiz_data, list) or len(quiz_data) != num_questions:
            raise ValueError("Generated quiz does not match the requested number of questions.")
        
        for q in quiz_data:
            if not all(key in q for key in ["question", "options", "correct_answer"]):
                raise ValueError("Quiz question is missing required keys.")
            if q["correct_answer"] not in q["options"]:
                raise ValueError("Correct answer is not listed in the options for a question.")

        return {"success": True, "quiz": quiz_data}
    except Exception as e:
        logger.error(f"Error generating full quiz: {str(e)}")
        return {"success": False, "error": f"Failed to generate a valid quiz. Error: {str(e)}"}


def analyze_quiz_results(context, quiz_questions, user_answers):
    """Analyzes quiz results to identify strong and weak areas."""
    
    if not quiz_questions or not user_answers:
        return {"success": False, "error": "Invalid quiz data provided for analysis."}

    correct_questions = []
    incorrect_questions = []

    for i, q in enumerate(quiz_questions):
        user_answer = user_answers.get(str(i))
        if user_answer == q["correct_answer"]:
            correct_questions.append(q["question"])
        else:
            incorrect_questions.append({
                "question": q["question"],
                "user_answer": user_answer or "Not answered",
                "correct_answer": q["correct_answer"]
            })
    
    if not incorrect_questions:
        return {
            "success": True, 
            "analysis": {
                "strong_areas": ["All topics covered!"],
                "weak_areas": [],
                "feedback": "Excellent work! You answered all questions correctly. You have a strong understanding of the material."
            }
        }

    # --- SOLUTION: Format the string before the f-string ---
    correctly_answered_formatted = "- " + "\n- ".join(correct_questions)
    # --- END OF SOLUTION ---

    prompt = f"""You are an expert tutor providing feedback on a quiz. The quiz was based on the original context provided below.

Original Context:
---
{context}
---

The student's performance is as follows:

Correctly Answered Questions (Their Strong Topics):
{correctly_answered_formatted}

Incorrectly Answered Questions (Their Weak Topics):
{json.dumps(incorrect_questions, indent=2)}

---
Based on this performance, analyze the student's weak areas. Provide encouraging and actionable feedback. Your response must be a single, valid JSON object with the following keys:
- "strong_areas": A list of 1-2 topics the student understands well.
- "weak_areas": A list of 1-2 specific topics the student needs to review, based on the incorrect answers.
- "feedback": A concise paragraph (2-3 sentences) suggesting what to study next.

Return only the valid JSON object.
"""

    try:
        logger.info("Generating quiz analysis.")
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        analysis_data = json.loads(cleaned_text)

        if not all(key in analysis_data for key in ["strong_areas", "weak_areas", "feedback"]):
            raise ValueError("Analysis is missing required fields.")

        return {"success": True, "analysis": analysis_data}
    except Exception as e:
        logger.error(f"Error generating quiz analysis: {str(e)}")
        return {"success": False, "error": f"Failed to generate quiz analysis. Error: {str(e)}"}
