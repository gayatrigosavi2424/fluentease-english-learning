import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StreakStats from "../components/StreakStats";
import StreakCalendar from "../components/StreakCalendar";
import StreakAchievements from "../components/StreakAchievements";
import StreakDemo from "../components/StreakDemo";

export default function Streaks() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">🔐 Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to log in to see your learning streaks.</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-4">
            🔥 Learning Streaks
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Track your daily learning progress with our GitHub-style streak system. 
            Build consistency and unlock achievements on your English learning journey!
          </p>
        </div>

        {/* Demo Section for New Users */}
        <StreakDemo />

        <div className="space-y-8">
          {/* Streak Statistics Section */}
          <section>
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">📊 Your Streak Statistics</h2>
                <p className="text-gray-600">Monitor your learning consistency and progress</p>
              </div>
              <StreakStats userId={user.uid} />
            </div>
          </section>

          {/* Activity Calendar Section */}
          <section>
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">📅 Activity Calendar</h2>
                <p className="text-gray-600">GitHub-style visualization of your learning journey</p>
              </div>
              <StreakCalendar userId={user.uid} />
            </div>
          </section>

          {/* Achievements Section */}
          <section>
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">🏆 Learning Achievements</h2>
                <p className="text-gray-600">Unlock badges by maintaining consistent learning habits</p>
              </div>
              <StreakAchievements userId={user.uid} />
            </div>
          </section>

          {/* Quick Actions Section */}
          <section>
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">🚀 Keep Your Streak Going</h2>
                <p className="text-gray-600">Practice today to maintain your learning streak</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => navigate("/speak")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="text-4xl mb-3">🎤</div>
                  <div className="font-semibold text-lg mb-2">Practice Speaking</div>
                  <div className="text-sm opacity-90">Improve your pronunciation and fluency</div>
                </button>

                <button
                  onClick={() => navigate("/write")}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="text-4xl mb-3">✍️</div>
                  <div className="font-semibold text-lg mb-2">Practice Writing</div>
                  <div className="text-sm opacity-90">Enhance your grammar and vocabulary</div>
                </button>

                <button
                  onClick={() => navigate("/describe")}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="text-4xl mb-3">🖼️</div>
                  <div className="font-semibold text-lg mb-2">Practice Describing</div>
                  <div className="text-sm opacity-90">Develop descriptive language skills</div>
                </button>
              </div>
            </div>
          </section>

          {/* Streak Tips Section */}
          <section>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 shadow-2xl rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">💡 Streak Building Tips</h2>
                <p className="text-gray-600">Maximize your learning consistency with these strategies</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/70 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">⏰</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Set a Daily Time</h3>
                  <p className="text-sm text-gray-600">Choose a consistent time each day for learning</p>
                </div>
                
                <div className="bg-white/70 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Start Small</h3>
                  <p className="text-sm text-gray-600">Even 5-10 minutes daily builds a strong habit</p>
                </div>
                
                <div className="bg-white/70 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">📱</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Set Reminders</h3>
                  <p className="text-sm text-gray-600">Use phone notifications to stay consistent</p>
                </div>
                
                <div className="bg-white/70 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Celebrate Wins</h3>
                  <p className="text-sm text-gray-600">Acknowledge your progress and achievements</p>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Back */}
          <div className="text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition shadow-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}