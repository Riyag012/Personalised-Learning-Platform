import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Quiz.css";

const Quiz = () => {
  const [context, setContext] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartQuiz = async () => {
    if (!context.trim()) {
      setError("Please enter content for the quiz.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/generate-quiz", {
        context,
        session_id: null, // Start a new session
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      // Check if quiz is already completed (shouldn't happen on start)
      if (res.data.completed) {
        setQuizCompleted(true);
        return;
      }

      setQuiz({
        question: res.data.question,
        options: res.data.options,
        correct_answer: res.data.correct_answer,
      });
      setSessionId(res.data.session_id);
      setQuestionNumber(res.data.question_number);
      setTotalQuestions(res.data.total_questions);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuizStarted(true);
      setCorrectAnswers(0);
    } catch (err) {
      console.error("⚠️ API Error:", err.message);
      setError("Failed to generate quiz. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate-quiz", {
        context,
        session_id: sessionId,
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      // Check if quiz is completed
      if (res.data.completed) {
        setQuizCompleted(true);
        return;
      }

      setQuiz({
        question: res.data.question,
        options: res.data.options,
        correct_answer: res.data.correct_answer,
      });
      setQuestionNumber(res.data.question_number);
      setTotalQuestions(res.data.total_questions);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (err) {
      console.error("⚠️ API Error:", err.message);
      setError("Failed to generate next question. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelection = (answer) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    // Track correct answers
    if (answer === quiz.correct_answer) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleRestartQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setSessionId(null);
    setQuiz(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestionNumber(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
  };

  return (
    <div className="summary-container">
      <Navbar />
      <div className="summary-content">
        <h2 className="summary-title">Generate Quiz</h2>

        {!quizStarted ? (
          <div>
            <div className="input-group">
              <label htmlFor="context-input">Enter content for quiz:</label>
              <textarea
                id="context-input"
                className="context-textarea"
                placeholder="Enter content for quiz"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <button
              className="summary-button"
              onClick={handleStartQuiz}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Start Quiz"}
            </button>
            
            {isLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating your quiz, please wait...</p>
              </div>
            )}
          </div>
        ) : quizCompleted ? (
          <div className="summary-result">
            <h3>Quiz Completed!</h3>
            <div className="summary-text">
              <p>
                You answered {correctAnswers} out of {totalQuestions} questions
                correctly.
              </p>
              <p>Your score: {Math.round((correctAnswers / totalQuestions) * 100)}%</p>
            </div>
            <button
              className="summary-button"
              onClick={handleRestartQuiz}
            >
              Start New Quiz
            </button>
          </div>
        ) : (
          <div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              ></div>
            </div>
            
            <div className="question-container">
              <h3>Question {questionNumber} of {totalQuestions}</h3>
              <p>{quiz.question}</p>
              
              <div className="options-list">
                {quiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelection(option)}
                    disabled={showResult}
                    className={`option-button ${
                      showResult
                        ? option === quiz.correct_answer
                          ? "correct"
                          : option === selectedAnswer
                          ? "incorrect"
                          : ""
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {isLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading next question...</p>
              </div>
            )}

            {showResult && (
              <div className={`summary-result ${
                selectedAnswer === quiz.correct_answer ? "correct-result" : "incorrect-result"
              }`}>
                <div className="summary-text">
                  {selectedAnswer === quiz.correct_answer
                    ? "✅ Correct!"
                    : `❌ Incorrect! The correct answer is: ${quiz.correct_answer}`}
                </div>

                <button
                  className="summary-button"
                  onClick={handleNextQuestion}
                  disabled={isLoading}
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;