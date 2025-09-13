import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Quiz.css";

const Quiz = () => {
  // State for quiz setup
  const [context, setContext] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State for active quiz
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // --- NEW: State for analysis ---
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // --- END NEW ---

  const [searchParams] = useSearchParams();
  const contextId = searchParams.get("contextId");

  const handleStartQuiz = async () => {
    if (!contextId && !context.trim()) {
      setError("Please enter content for the quiz.");
      return;
    }
    setIsLoading(true);
    setError("");
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setAnalysis(null); // Reset analysis

    try {
      const res = await axios.post("http://127.0.0.1:8000/generate-quiz", {
        context_id: contextId,
        context: context,
        num_questions: Number(numQuestions),
      });
      if (res.data.error) throw new Error(res.data.error);
      setQuizQuestions(res.data.quiz);
    } catch (err) {
      setError("Failed to generate quiz. The content may be too short or the format invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: answer,
    });
  };

  // --- MODIFIED: handleSubmitQuiz now triggers analysis ---
  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true);
    window.scrollTo(0, 0); // Scroll to top to see results

    // Start analysis
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze-quiz", {
        context_id: contextId,
        context: context,
        quiz: quizQuestions,
        answers: userAnswers,
      });
      if (res.data.error) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error("Analysis Error:", err);
      // Set a default error message for analysis
      setAnalysis({ error: "Could not generate feedback for this quiz." });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correct_answer) {
        score++;
      }
    });
    return score;
  };

  const handleRestart = () => {
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setError("");
    setAnalysis(null);
    // Keep manual context if it was entered
  };

  // ... (renderSetupScreen and renderQuizScreen remain the same) ...

  const renderResultsScreen = () => {
    const score = calculateScore();
    const percentage = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="results-container">
        <h2>Quiz Results</h2>
        <p className="score-text">
          You scored {score} out of {quizQuestions.length} ({percentage}%)
        </p>

        {/* --- NEW: Analysis Section --- */}
        <div className="analysis-section">
          {isAnalyzing && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Generating personalized feedback...</p>
            </div>
          )}
          {analysis && !isAnalyzing && (
            <div className="analysis-content">
              <h3>Personalized Feedback</h3>
              {analysis.error ? (
                 <p className="error-message">{analysis.error}</p>
              ) : (
                <>
                  <div className="feedback-block">
                    <strong>Strong Areas:</strong>
                    <ul>
                      {analysis.strong_areas.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                  </div>
                  <div className="feedback-block">
                    <strong>Areas for Improvement:</strong>
                    <ul>
                      {analysis.weak_areas.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                  </div>
                  <div className="feedback-block">
                    <strong>Suggestions:</strong>
                    <p>{analysis.feedback}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {/* --- END NEW --- */}
        
        {quizQuestions.map((q, index) => (
          <div key={index} className="question-result">
            <p className="question-text"><strong>{index + 1}. {q.question}</strong></p>
            <p className={userAnswers[index] === q.correct_answer ? "correct-answer" : "incorrect-answer"}>
              Your answer: {userAnswers[index] || "Not answered"}
            </p>
            {userAnswers[index] !== q.correct_answer && (
              <p className="correct-answer">Correct answer: {q.correct_answer}</p>
            )}
          </div>
        ))}
        <button className="start-button" onClick={handleRestart}>
          Take Another Quiz
        </button>
      </div>
    );
  };
  
  // Copy the `renderSetupScreen` and `renderQuizScreen` functions from the previous version here...
  // For completeness, here they are again:
  const renderSetupScreen = () => (
    <div>
      {contextId ? (
        <div className="context-notification">
          <p><strong>Mode:</strong> Generating a quiz from your provided document/URL.</p>
        </div>
      ) : (
        <div className="input-group">
          <label htmlFor="context-input">Content to Create Quiz From:</label>
          <textarea
            id="context-input"
            className="context-textarea"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows="10"
          />
        </div>
      )}
      <div className="input-group">
        <label htmlFor="num-questions">Number of Questions:</label>
        <select
          id="num-questions"
          className="level-select"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
        >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
        </select>
      </div>
      <button className="start-button" onClick={handleStartQuiz}>
        {isLoading ? "Generating..." : "Generate Quiz"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
  
  const renderQuizScreen = () => (
    <div>
      {quizQuestions.map((q, index) => (
        <div key={index} className="question-block">
          <p className="question-text"><strong>{index + 1}. {q.question}</strong></p>
          <div className="options-group">
            {q.options.map((option, i) => (
              <label key={i} className="option-label">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  checked={userAnswers[index] === option}
                  onChange={() => handleAnswerChange(index, option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="start-button submit-button" onClick={handleSubmitQuiz}>
        Submit Quiz
      </button>
    </div>
  );


  return (
    <div className="quiz-container">
      <Navbar />
      <div className="quiz-content">
        <h2>Generate Quiz</h2>
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Generating your quiz, please wait...</p>
          </div>
        )}
        {!isLoading && quizQuestions.length === 0 && renderSetupScreen()}
        {!isLoading && quizQuestions.length > 0 && !quizSubmitted && renderQuizScreen()}
        {quizSubmitted && renderResultsScreen()}
      </div>
    </div>
  );
};

export default Quiz;
