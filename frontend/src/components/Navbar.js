import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li>
          <Link to="/" className="nav-link">Home</Link>
        </li>
        <li>
          <Link to="/ask" className="nav-link">Ask Question</Link>
        </li>
        <li>
          <Link to="/summarize" className="nav-link">Summarize</Link>
        </li>
        <li>
          <Link to="/quiz" className="nav-link">Quiz</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;