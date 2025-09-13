import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Summary.css";

// SVG Icons for consistency
const MicIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path> <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path> <line x1="12" y1="19" x2="12" y2="22"></line> </svg> );
const SpeakerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon> <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path> </svg> );


const Summary = () => {
  const [context, setContext] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW STATE FOR VOICE FEATURES ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // --- END NEW STATE ---

  const [searchParams] = useSearchParams();
  const contextId = searchParams.get("contextId");

  // --- NEW: SETUP SPEECH RECOGNITION & CLEANUP ---
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true; // Continuous listening for longer dictation
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setContext(prevContext => prevContext + finalTranscript);
    };

    recognitionRef.current = recognition;
    recognitionRef.current.start();
  };

  const handleSpeakerClick = () => {
    if (summary) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const utterance = new SpeechSynthesisUtterance(summary);
        window.speechSynthesis.speak(utterance);
      }
    }
  };
  // --- END NEW FEATURES ---

  const handleSummary = async () => {
    if (!contextId && !context.trim()) {
      setError("Please enter content to summarize");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/summarize", {
        context_id: contextId,
        context: context,
        user_level: userLevel,
      });
      
      setSummary(res.data.summary);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to generate summary.");
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-container">
      <Navbar />
      <div className="summary-content">
        <h2>Summarize Content</h2>

        {contextId ? (
          <div className="context-notification">
            <p><strong>Mode:</strong> Summarizing your provided document/URL.</p>
          </div>
        ) : (
          <div className="input-group">
            <label htmlFor="context-input">Content to Summarize:</label>
            <div className="input-area">
              <textarea
                id="context-input"
                className="context-textarea"
                placeholder={isListening ? "Listening..." : "Type or dictate the content to summarize..."}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows="10"
              />
              <div className="input-controls">
                <button 
                  className={`mic-button ${isListening ? 'listening' : ''}`} 
                  title="Dictate content"
                  onClick={handleMicClick}
                >
                    <MicIcon />
                </button>
              </div>
            </div>
          </div>
        )}
        
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
          {isLoading ? "Summarizing..." : "Generate Summary"}
        </button>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Generating your summary...</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {summary && !isLoading && !error && (
          <div className="summary-result">
            <div className="response-header">
              <h3>Summary</h3>
              <button 
                className="speaker-button" 
                title="Read summary aloud"
                onClick={handleSpeakerClick}
              >
                <SpeakerIcon />
              </button>
            </div>
            <div className="summary-text">{summary}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
