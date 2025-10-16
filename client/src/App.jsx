import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Write from "./pages/Write";
import Speak from "./pages/Speak";
import Describe from "./pages/Describe";
import Streaks from "./pages/Streaks";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Layout
import Navbar from "./components/Navbar";

// Context
import { AuthProvider } from "./context/AuthContext";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [refreshCount, setRefreshCount] = useState(0);

  const handleProgressUpdate = () => {
    setRefreshCount((prev) => prev + 1); // trigger dashboard re-fetch
  };

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard refresh={refreshCount} />} />
          <Route path="/speak" element={<Speak onProgressUpdate={handleProgressUpdate} />} />
          <Route path="/write" element={<Write onProgressUpdate={handleProgressUpdate} />} />
          <Route path="/describe" element={<Describe onProgressUpdate={handleProgressUpdate} />} />
          <Route path="/streaks" element={<Streaks />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <ToastContainer position="top-center" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}
