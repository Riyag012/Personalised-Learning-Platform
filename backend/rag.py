import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import Pinecone
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone as PineconeClient
from langchain_core.runnables import RunnablePassthrough
# from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables
load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-pro')

# Function to call Gemini API
def call_gemini_api(query, context):
    prompt = f"""Answer based ONLY on this context:
    {context}
    
    Question: {query}
    
    Answer concisely in 1-2 sentences:"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return "Error generating response"

# Load and process documents
def load_and_process_documents(file_path):
    print("Loading PDF...")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    print("Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
    docs = text_splitter.split_documents(documents)
    return docs

# Initialize Pinecone and create vector store
def initialize_pinecone(index_name, docs, embeddings):
    print("Initializing Pinecone client...")
    pc = PineconeClient(api_key=os.getenv("PINECONE_API_KEY"))
    
    print("Checking Pinecone index...")
    if index_name not in pc.list_indexes().names():
        raise ValueError(f"Index '{index_name}' missing. Create it first in Pinecone dashboard.")
    
    print("Creating vector store...")
    vectorstore = Pinecone.from_documents(docs, embeddings, index_name=index_name)
    return vectorstore

# Create retriever and QA chain
def create_qa_chain(vectorstore):
    print("Creating retriever...")
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
    
    prompt = ChatPromptTemplate.from_template(
        """Answer using ONLY this context:
        {context}
        
        Question: {input}
        
        Concise answer (1-2 sentences):"""
    )
    
    def combine_docs_chain(inputs):
        return call_gemini_api(inputs["input"], inputs["context"])
    
    qa_chain = create_retrieval_chain(retriever, combine_docs_chain)
    return qa_chain