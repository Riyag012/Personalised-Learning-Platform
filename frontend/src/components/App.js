import React from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import "./App.css";

const App = () => {
  return (
    <div className="home-container">
      <Navbar />
      <h1>Welcome to the Personalized Learning Platform</h1>
      <p>Enhance your learning with AI-powered assistance.</p>
      <div className="home-buttons">
        <Link to="/ask">
          <button className="home-button">Ask a Question</button>
        </Link>
        <Link to="/summarize">
          <button className="home-button">Summarize Content</button>
        </Link>
        <Link to="/quiz">
          <button className="home-button">Generate Quiz</button>
        </Link>
      </div>
    </div>
  );
};

export default App;