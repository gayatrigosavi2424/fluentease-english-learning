import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">👤 Your Profile</h2>

        {user ? (
          <div className="space-y-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            >
              Logout

            </button>
          </div>
        ) : (
          <p className="text-gray-600">User not logged in.</p>
        )}
      </div>
    </div>
  );
}
