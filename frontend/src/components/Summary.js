import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Summary = () => {
  const [context, setContext] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");
  const [summary, setSummary] = useState(null);

  const handleSummary = async () => {
    console.log("Summary button clicked!");
    try {
      const res = await axios.post("http://127.0.0.1:8000/summarize", {
        context,
        user_level: userLevel,
      });
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Summarize Content</h2>
      <textarea
        placeholder="Enter content to summarize"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />
      <select value={userLevel} onChange={(e) => setUserLevel(e.target.value)}>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button onClick={handleSummary}>Summary</button>

      {summary && (
        <div>
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default Summary;
