import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./AskQuestion.css";

const AskQuestion = () => {
  const [query, setQuery] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsk = async () => {
    console.log("Ask button clicked!");
    
    // Validate input
    if (!query.trim()) {
      setError("Please enter a question");
      return;
    }
    
    // Reset states
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        query,
        user_level: userLevel,
      });
      
      setResponse(res.data);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.detail || 
               "Failed to get response. Please try again.");
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ask-container">
      <Navbar />
      <div className="ask-form">
        <h2 className="summary-title">Ask a Question</h2>
        
        <div className="input-group">
          <label htmlFor="question-input">Your Question:</label>
          <input
            id="question-input"
            className="question-input"
            placeholder="Enter your question"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="level-select">Learning Level:</label>
          <select 
            id="level-select"
            className="level-select"
            value={userLevel} 
            onChange={(e) => setUserLevel(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <button 
          className="ask-button" 
          onClick={handleAsk}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Ask Question"}
        </button>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Processing your question, please wait...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {response && !isLoading && !error && (
          <div className="response-container">
            <h3>Response:</h3>
            <div className="response-text">{response.answer}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskQuestion;