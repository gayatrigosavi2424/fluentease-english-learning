import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Speak", path: "/speak" },
    { name: "Write", path: "/write" },
    { name: "Describe", path: "/describe" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Streaks", path: "/streaks" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-tight">
          FluentEase<span className="text-indigo-500">.</span>
        </Link>

        {/* Nav Links */}
        <div className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium px-2 py-1 rounded-md transition-all duration-200 ${
                pathname === item.path
                  ? "text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="relative">
          {!user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
              >
                Account
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow-md w-32 z-50">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/profile")}
              className="bg-gray-100 text-sm px-4 py-1.5 rounded hover:bg-gray-200"
            >
              Profile
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
