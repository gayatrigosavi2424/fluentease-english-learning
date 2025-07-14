import React from "react";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Speak from "./pages/Speak";
import Write from "./pages/Write";
import Dashboard from "./pages/Dashboard";
import Layout from "./layout/Layout";
import Describe from "./pages/Describe";
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';


function App() {
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
           <Route path="/speak" element={<Speak onProgressUpdate={triggerRefresh} />} />
          <Route path="/write" element={<Write onProgressUpdate={triggerRefresh} />} />
          <Route path="/dashboard" element={<Dashboard refresh={refreshCount} />} />
          <Route path="/describe" element={<Describe onProgressUpdate={triggerRefresh} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
        
        </Routes>
      </Layout>
       <ToastContainer position="top-right" autoClose={3000} />
    </Router>
    
  );
}

export default App;
