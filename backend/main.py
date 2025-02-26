from flask import Flask, request, jsonify
from rag import load_and_process_documents, initialize_pinecone, create_qa_chain
from summarization import summarize_content
from quiz_generation import generate_quiz
from langchain_community.embeddings import HuggingFaceEmbeddings
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Load and process documents
docs = load_and_process_documents("fine_tuning_LLM.pdf")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = initialize_pinecone("my-index", docs, embeddings)
qa_chain = create_qa_chain(vectorstore)

@app.route('/')
def home():
    return "Welcome to the Personalized Learning API! Use /ask or /generate-quiz."

@app.route('/ask', methods=['POST','GET'])
def ask_question():
    try:
        data = request.get_json()
        user_query = data.get("query")
        user_level = data.get("user_level")
        
        if not user_query:
            return jsonify({"error": "Query is required"}), 400
        
        response = qa_chain.invoke({"input": user_query})
        context = response.get("context", "")
        answer = response.get("answer", "")
        
        summary = summarize_content(context, user_level)
        
        return jsonify({"answer": answer, "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    try:
        data = request.get_json()
        context = data.get("context")
        
        if not context:
            return jsonify({"error": "Context is required"}), 400
        
        quiz = generate_quiz(context)
        return jsonify({"quiz": quiz})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.get_json()
        context = data.get("context")
        user_level = data.get("user_level")
        
        if not context:
            return jsonify({"error": "Context is required"}), 400
        
        summary = summarize_content(context, user_level)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
