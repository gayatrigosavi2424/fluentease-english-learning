// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserProgress } from "../services/progress";

const sections = ["speak", "write", "describe"];

const getBadge = (score) => {
  if (score >= 9) return { label: "🏅 Gold", color: "text-yellow-600" };
  if (score >= 6) return { label: "🥈 Silver", color: "text-gray-600" };
  if (score >= 3) return { label: "🥉 Bronze", color: "text-orange-600" };
  return { label: "🚀 Keep Going", color: "text-blue-600" };
};

export default function Dashboard({ refresh }) {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState({});

  useEffect(() => {
  const fetchProgress = async () => {
    if (user) {
      const data = await getUserProgress(user.uid);
      setProgress(data || {});
      
    }
  };
  fetchProgress();
}, [user, refresh]); // ✅ 'refresh' must be here!


  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-100 p-6 flex flex-col items-center">
      <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-3xl p-8 max-w-3xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-4">📊 Your Learning Dashboard</h2>

        {sections.map((section) => {
          const score = progress[section] || 0;
          const badge = getBadge(score);
          return (
            <div key={section} className="mb-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold capitalize text-gray-800">{section}</h3>
                <span className={`text-sm font-bold ${badge.color}`}>{badge.label}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(score * 10, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">Score: {score} / 10</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
