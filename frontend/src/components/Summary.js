import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Summary.css"; // You'll need to create this CSS file

const Summary = () => {
  const [context, setContext] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSummary = async () => {
    console.log("Summary button clicked!");
    const handleSummary = async () => {
      // ... existing code
      
      try {
          const res = await axios.post("http://127.0.0.1:8000/summarize", {
              context: context.trim(),
              user_level: userLevel
          });
          
          if (res.data.error) {
              setError(res.data.error);
          } else {
              setSummary(res.data.summary);
          }
          
      } catch (error) {
          // Update error handling
          const errorMsg = error.response?.data?.error || 
                          error.message || 
                          "Failed to generate summary";
          setError(errorMsg);
      }
      // ... rest of code
  };
    
    // Validate input
    if (!context.trim()) {
      setError("Please enter content to summarize");
      return;
    }
    
    // Reset states
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/summarize", {
        context,
        user_level: userLevel,
      });
      
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.detail || 
               "Failed to generate summary. Please try again.");
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-container">
      <Navbar />
      <div className="summary-content">
        <h2 className="summary-title">Summarize Content</h2>
        
        <div className="input-group">
          <label htmlFor="context-input">Content to Summarize:</label>
          <textarea
            id="context-input"
            className="context-textarea"
            placeholder="Enter content to summarize"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows="8"
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
          className="summary-button" 
          onClick={handleSummary}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Summary"}
        </button>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Generating your summary, please wait...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {summary && !isLoading && !error && (
          <div className="summary-result">
            <h3>Summary:</h3>
            <div className="summary-text">{summary}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;