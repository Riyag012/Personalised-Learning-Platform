import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./AskQuestion.css";

// SVG Icons (no changes here)
const MicIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path> <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path> <line x1="12" y1="19" x2="12" y2="22"></line> </svg> );
const SpeakerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon> <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path> </svg> );

const AskQuestion = () => {
  // State variables
  const [query, setQuery] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  // Use a ref to hold the recognition object instance
  const recognitionRef = useRef(null);

  const [searchParams] = useSearchParams();
  const contextId = searchParams.get("contextId");

  // This effect is now only for cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    // --- SOLUTION: Initialize the recognition object ON CLICK ---
    if (!('webkitSpeechRecognition' in window)) {
        console.error("Speech recognition is not supported in this browser.");
        return;
    }

    // If we are currently listening, stop the existing recognition instance
    if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
    }

    // Create a new recognition instance every time the user clicks to start
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started.");
      setIsListening(true);
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended.");
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    // Store the new instance in the ref and start it
    recognitionRef.current = recognition;
    recognitionRef.current.start();
  };
  // --- END OF SOLUTION ---

  const handleSpeakerClick = () => {
    if (response?.answer) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const utterance = new SpeechSynthesisUtterance(response.answer);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) {
      setError("Please enter a question");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        query,
        user_level: userLevel,
        context_id: contextId,
      });
      setResponse(res.data);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.error || "Failed to get response. Please try again.");
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ask-container">
      <Navbar />
      <div className="ask-content">
        <h2>Ask a Question</h2>

        {contextId && (
          <div className="context-notification">
            <p><strong>Mode:</strong> Answering from your provided document/URL.</p>
          </div>
        )}
        
        <div className="input-group">
          <label htmlFor="question-input">Your Question:</label>
          <div className="input-area">
            <textarea
              id="question-input"
              className="query-textarea"
              placeholder={isListening ? "Listening..." : "Type your question here, or use the microphone..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows="3"
            />
            <div className="input-controls">
                <button 
                  className={`mic-button ${isListening ? 'listening' : ''}`} 
                  title="Ask with voice"
                  onClick={handleMicClick}
                >
                    <MicIcon />
                </button>
            </div>
          </div>
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
          {isLoading ? "Thinking..." : "Get Answer"}
        </button>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Searching for the answer...</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {response && !isLoading && !error && (
          <div className="response-container">
            <div className="response-header">
              <h3>Answer</h3>
              <button 
                className="speaker-button" 
                title="Read answer aloud"
                onClick={handleSpeakerClick}
              >
                <SpeakerIcon />
              </button>
            </div>
            <div className="response-text">{response.answer}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskQuestion;

