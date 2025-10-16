import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserProgress } from "../services/progress";
import { useNavigate } from "react-router-dom";

export default function Dashboard({ refresh }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [progress, setProgress] = useState({
    speak: 0,
    write: 0,
    describe: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProgress = useCallback(async (showUpdating = false) => {
    if (!user) return;

    console.log("🔄 Fetching progress for dashboard...");
    if (showUpdating) setIsUpdating(true);

    // Use a ref to check if this is the initial load
    const isInitialLoad = !progress.speak && !progress.write && !progress.describe;
    if (isInitialLoad) setLoading(true);

    try {
      const data = await getUserProgress(user.uid);
      console.log("📊 Progress data received:", data);

      const progressData = {
        speak: data.speak || 0,
        write: data.write || 0,
        describe: data.describe || 0,
      };

      setProgress(progressData);
      setLastUpdated(new Date().toLocaleTimeString());

      // Calculate statistics
      const scores = Object.values(progressData).filter(score => score > 0);
      setTotalSessions(scores.length);
      setAverageScore(scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0);

      console.log("✅ Dashboard updated with progress");
    } catch (error) {
      console.error("❌ Error fetching progress:", error);
    }

    setLoading(false);
    setIsUpdating(false);
  }, [user]);

  // Create a ref to store the latest fetchProgress function
  const fetchProgressRef = useRef(fetchProgress);
  fetchProgressRef.current = fetchProgress;

  // Initial load and refresh when user or refresh prop changes
  useEffect(() => {
    if (user) {
      fetchProgressRef.current();
    }
  }, [user, refresh]);

  // Auto-refresh every 60 seconds when user is on dashboard (less aggressive)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard...");
      fetchProgressRef.current();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Listen for focus events to refresh when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log("👀 Tab focused, refreshing dashboard...");
      fetchProgressRef.current();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 text-center">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">🔐 Please Log In</h2>
        <p className="text-gray-600">You need to log in to see your progress dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">
            📊 Your Learning Dashboard
          </h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => fetchProgressRef.current(true)}
              disabled={loading || isUpdating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              {loading || isUpdating ? "🔄 Refreshing..." : "🔄 Refresh Progress"}
            </button>
            {lastUpdated && (
              <span className="text-gray-600 text-sm">
                Last updated: {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10">
              <p className="text-gray-600 text-lg">Loading your progress...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Stats */}
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">📈 Overall Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-gradient-to-r from-green-100 to-green-200 p-6 rounded-2xl">
                  <div className="text-3xl font-bold text-green-700">{Math.max(progress.speak, progress.write, progress.describe)}</div>
                  <div className="text-green-600 font-medium">Best Score</div>
                </div>
                <div className="text-center bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-2xl">
                  <div className="text-3xl font-bold text-blue-700">{averageScore}</div>
                  <div className="text-blue-600 font-medium">Average Score</div>
                </div>
                <div className="text-center bg-gradient-to-r from-purple-100 to-purple-200 p-6 rounded-2xl">
                  <div className="text-3xl font-bold text-purple-700">{totalSessions}</div>
                  <div className="text-purple-600 font-medium">Sections Completed</div>
                </div>
              </div>
            </div>

            {/* Individual Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Speak Progress */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">🎤</div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Speaking</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">{progress.speak}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.speak / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-600 text-sm">
                  {progress.speak === 0 ? "Start practicing!" :
                    progress.speak < 5 ? "Keep practicing!" :
                      progress.speak < 8 ? "Good progress!" : "Excellent work!"}
                </p>
              </div>

              {/* Write Progress */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">✍️</div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Writing</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">{progress.write}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.write / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-600 text-sm">
                  {progress.write === 0 ? "Start writing!" :
                    progress.write < 5 ? "Keep writing!" :
                      progress.write < 8 ? "Great improvement!" : "Outstanding!"}
                </p>
              </div>

              {/* Describe Progress */}
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Describing</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">{progress.describe}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.describe / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-600 text-sm">
                  {progress.describe === 0 ? "Try describing!" :
                    progress.describe < 5 ? "Keep describing!" :
                      progress.describe < 8 ? "Vivid descriptions!" : "Master describer!"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">🚀 Practice Now</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => navigate("/speak")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">🎤</div>
                  <div className="font-semibold">Practice Speaking</div>
                  <div className="text-sm opacity-90">Current: {progress.speak}/10</div>
                </button>

                <button
                  onClick={() => navigate("/write")}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">✍️</div>
                  <div className="font-semibold">Practice Writing</div>
                  <div className="text-sm opacity-90">Current: {progress.write}/10</div>
                </button>

                <button
                  onClick={() => navigate("/describe")}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="font-semibold">Practice Describing</div>
                  <div className="text-sm opacity-90">Current: {progress.describe}/10</div>
                </button>
              </div>

              {/* Streaks Link */}
              <div className="text-center">
                <button
                  onClick={() => navigate("/streaks")}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <div className="font-semibold text-lg">View Learning Streaks</div>
                      <div className="text-sm opacity-90">Track your daily progress & achievements</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 shadow-2xl rounded-3xl p-8 text-center">
              <h3 className="text-2xl font-bold text-orange-800 mb-4">🌟 Keep Learning!</h3>
              <p className="text-orange-700 text-lg mb-4">
                {totalSessions === 0 ? "Start your English learning journey today!" :
                  totalSessions === 1 ? "Great start! Try the other sections too." :
                    totalSessions === 2 ? "You're making excellent progress!" :
                      "Amazing! You're mastering all areas of English!"}
              </p>

              {/* Next Goal */}
              <div className="bg-white/50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-orange-800 mb-2">🎯 Next Goal:</h4>
                <p className="text-orange-700 text-sm">
                  {Math.max(progress.speak, progress.write, progress.describe) < 5 ?
                    "Reach a score of 5 in any section!" :
                    Math.max(progress.speak, progress.write, progress.describe) < 8 ?
                      "Reach a score of 8 in any section!" :
                      totalSessions < 3 ?
                        "Try all three practice sections!" :
                        "Maintain your excellent progress!"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}