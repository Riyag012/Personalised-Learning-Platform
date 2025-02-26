import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const AskQuestion = () => {
  const [query, setQuery] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [response, setResponse] = useState(null);

  // const handleAsk = async () => {
  //   try {
  //     const res = await axios.post("http://127.0.0.1:8000/ask", {
  //       query,
  //       user_level: userLevel,
  //     });
  //     setResponse(res.data);
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
  // };
  const handleAsk = async () => {
    try {
        console.log("Sending request to /ask with query:", query);  // Debugging
        const res = await axios.post("http://127.0.0.1:8000/ask", {
            query,
            user_level: userLevel,
        });
        console.log("Received response:", res.data);  // Debugging
        setResponse(res.data);
    } catch (error) {
        console.error("Error:", error);
    }
};

  return (
    <div>
      <Navbar />
      <h2>Ask a Question</h2>
      <input
        type="text"
        placeholder="Enter your question"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={userLevel} onChange={(e) => setUserLevel(e.target.value)}>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button onClick={handleAsk}>Ask</button>

      {response && (
        <div>
          <h3>Answer:</h3>
          <p>{response.answer}</p>
          <h3>Summary:</h3>
          <p>{response.summary}</p>
        </div>
      )}
    </div>
  );
};

export default AskQuestion;
