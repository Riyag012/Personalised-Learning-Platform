import React from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";


const App = () => {
  return (
    <div>
      <Navbar />
      <h1>Welcome to the Personalized Learning Platform</h1>
      <p>Enhance your learning with AI-powered assistance.</p>
      <div>
        <Link to="/ask"><button>Ask a Question</button></Link>
        <Link to="/summarize"><button>Summarize Content</button></Link>
        <Link to="/quiz"><button>Generate Quiz</button></Link>
      </div>
    </div>
  );
};

export default App;
