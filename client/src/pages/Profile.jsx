import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { getUserProgress } from "../services/progress";
import { toast } from "react-toastify";
import NotificationSettings from "../components/NotificationSettings";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [progress, setProgress] = useState({ speak: 0, write: 0, describe: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        try {
          const data = await getUserProgress(user.uid);
          setProgress({
            speak: data.speak || 0,
            write: data.write || 0,
            describe: data.describe || 0,
          });
        } catch (error) {
          console.error("Error fetching progress:", error);
        }
      }
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const calculateLevel = () => {
    const totalScore = progress.speak + progress.write + progress.describe;
    if (totalScore >= 25) return { level: "Expert", color: "text-purple-600", bg: "bg-purple-100" };
    if (totalScore >= 20) return { level: "Advanced", color: "text-blue-600", bg: "bg-blue-100" };
    if (totalScore >= 15) return { level: "Intermediate", color: "text-green-600", bg: "bg-green-100" };
    if (totalScore >= 10) return { level: "Beginner+", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Beginner", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const getBadges = () => {
    const badges = [];
    if (progress.speak >= 8) badges.push({ name: "Speaking Master", emoji: "🎤", color: "bg-blue-100" });
    if (progress.write >= 8) badges.push({ name: "Writing Expert", emoji: "✍️", color: "bg-green-100" });
    if (progress.describe >= 8) badges.push({ name: "Description Pro", emoji: "🖼️", color: "bg-purple-100" });
    if (progress.speak >= 5 && progress.write >= 5 && progress.describe >= 5) {
      badges.push({ name: "All-Rounder", emoji: "🌟", color: "bg-yellow-100" });
    }
    return badges;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔐 Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to log in to view your profile.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const levelInfo = calculateLevel();
  const badges = getBadges();
  const totalScore = progress.speak + progress.write + progress.describe;
  const averageScore = totalScore > 0 ? (totalScore / 3).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {getInitials(user.email)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{user.displayName || "English Learner"}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${levelInfo.bg} ${levelInfo.color}`}>
                🏆 {levelInfo.level}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Learning Progress</h2>
          
          {loading ? (
            <p className="text-center text-gray-600">Loading progress...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Speaking */}
              <div className="text-center">
                <div className="text-6xl mb-2">🎤</div>
                <h3 className="text-lg font-semibold text-gray-700">Speaking</h3>
                <div className="text-3xl font-bold text-blue-600">{progress.speak}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.speak / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Writing */}
              <div className="text-center">
                <div className="text-6xl mb-2">✍️</div>
                <h3 className="text-lg font-semibold text-gray-700">Writing</h3>
                <div className="text-3xl font-bold text-green-600">{progress.write}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.write / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Describing */}
              <div className="text-center">
                <div className="text-6xl mb-2">🖼️</div>
                <h3 className="text-lg font-semibold text-gray-700">Describing</h3>
                <div className="text-3xl font-bold text-purple-600">{progress.describe}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.describe / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalScore}</div>
            <div className="text-gray-600">Total Score</div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{averageScore}</div>
            <div className="text-gray-600">Average Score</div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{badges.length}</div>
            <div className="text-gray-600">Badges Earned</div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🏅 Your Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div key={index} className={`${badge.color} p-4 rounded-xl text-center`}>
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <div className="font-semibold text-gray-700">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
          <NotificationSettings />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/speak")}
              className="bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 transition"
            >
              <div className="text-2xl mb-2">🎤</div>
              <div>Practice Speaking</div>
            </button>
            <button
              onClick={() => navigate("/write")}
              className="bg-green-500 text-white p-4 rounded-xl hover:bg-green-600 transition"
            >
              <div className="text-2xl mb-2">✍️</div>
              <div>Practice Writing</div>
            </button>
            <button
              onClick={() => navigate("/describe")}
              className="bg-purple-500 text-white p-4 rounded-xl hover:bg-purple-600 transition"
            >
              <div className="text-2xl mb-2">🖼️</div>
              <div>Practice Describing</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}