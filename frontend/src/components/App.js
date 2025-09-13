import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./App.css";
import axios from "axios"; // Make sure to import axios

const App = () => {
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [contextId, setContextId] = useState(null); // To store the ID from the backend
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(""); // To show success/error messages
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setYoutubeUrl(""); // Clear the other input
    setContextId(null); // Reset context if file changes
    setMessage("");
  };

  const handleUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setFile(null); // Clear the other input
    setContextId(null); // Reset context if URL changes
    setMessage("");
  };

  // This is the new function that calls our backend
  const handleProcessContext = async () => {
    if (!file && !youtubeUrl) {
      setMessage("Please upload a file or provide a YouTube URL.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("youtubeUrl", youtubeUrl);
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/process-context", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setContextId(response.data.context_id);
      setMessage(response.data.message || "Context processed successfully!");
    } catch (error) {
      console.error("Error processing context:", error);
      setMessage(error.response?.data?.error || "An error occurred while processing.");
      setContextId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // A helper to navigate with or without context
  const handleNavigate = (path) => {
    const destination = contextId ? `${path}?contextId=${contextId}` : path;
    navigate(destination);
  }

  return (
    <div className="home-container">
      <Navbar />
      <div className="main-content">
        <h1>Welcome to the Personalized Learning Platform</h1>
        <p>Enhance your learning with AI-powered assistance. Start by providing a document or a YouTube link, or continue without one to use general knowledge.</p>

        <div className="context-input-area">
          <h2>Provide Your Learning Context (Optional)</h2>
          <div className="input-options">
            <div className="file-upload-container">
              <label htmlFor="file-upload" className="file-upload-label">
                {file ? `Selected: ${file.name}` : "📁 Upload a Document (PDF, TXT)"}
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.md"
              />
            </div>

            <p className="or-divider">OR</p>

            <input
              type="text"
              className="youtube-url-input"
              placeholder="🔗 Paste a YouTube URL"
              value={youtubeUrl}
              onChange={handleUrlChange}
            />
          </div>

          {/* The New Submit Button */}
          <button 
            className="process-button" 
            onClick={handleProcessContext} 
            disabled={isLoading || (!file && !youtubeUrl)}
          >
            {isLoading ? "Processing..." : "Set Context"}
          </button>

          {/* Display messages to the user */}
          {message && <p className={`message ${contextId ? 'success' : 'error'}`}>{message}</p>}
        </div>

        <div className="home-buttons">
          {/* We now use a function to navigate, passing the contextId */}
          <button className="home-button" onClick={() => handleNavigate('/ask')}>
            Ask a Question
          </button>
          <button className="home-button" onClick={() => handleNavigate('/summarize')}>
            Summarize Content
          </button>
          <button className="home-button" onClick={() => handleNavigate('/quiz')}>
            Generate Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;