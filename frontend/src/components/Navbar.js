import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/ask">Ask Question</Link>
      <Link to="/summarize">Summarize</Link>
      <Link to="/quiz">Quiz</Link>
    </nav>
  );
};

export default Navbar;
