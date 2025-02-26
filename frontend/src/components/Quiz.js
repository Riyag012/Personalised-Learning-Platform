import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Quiz = () => {
  const [context, setContext] = useState("");
  const [quiz, setQuiz] = useState(null);

  const handleGenerateQuiz = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate-quiz", {
        context,
      });
      setQuiz(res.data.quiz);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Generate Quiz</h2>
      <textarea
        placeholder="Enter content for quiz"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />
      <button onClick={handleGenerateQuiz}>Generate Quiz</button>

      {quiz && (
        <div>
          <h3>Quiz:</h3>
          <p>{quiz}</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;
