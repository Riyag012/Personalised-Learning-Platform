import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./components/App";
import AskQuestion from "./components/AskQuestion";
import Summary from "./components/Summary";
import Quiz from "./components/Quiz";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ask" element={<AskQuestion />} />
        <Route path="/summarize" element={<Summary />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
