import React, { useState, useEffect } from 'react';
import { getUserStreaks, getWeeklyStats, getMonthlyStats } from '../services/streaks';

const StreakStats = ({ userId, refresh = 0 }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0
  });
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyCount: 0,
    weeklyDays: 0,
    averagePerDay: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    monthlyCount: 0,
    monthlyDays: 0,
    averagePerDay: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStreakData();
    }
  }, [userId, refresh]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const [streaks, weekly, monthly] = await Promise.all([
        getUserStreaks(userId),
        getWeeklyStats(userId),
        getMonthlyStats(userId)
      ]);
      
      setStreakData(streaks);
      setWeeklyStats(weekly);
      setMonthlyStats(monthly);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakEmoji = (streak) => {
    if (streak === 0) return '😴';
    if (streak < 3) return '🌱';
    if (streak < 7) return '🔥';
    if (streak < 14) return '⚡';
    if (streak < 30) return '🚀';
    if (streak < 100) return '💎';
    return '👑';
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return 'Start your learning journey!';
    if (streak === 1) return 'Great start! Keep it up!';
    if (streak < 7) return 'Building momentum!';
    if (streak < 14) return 'You\'re on fire!';
    if (streak < 30) return 'Incredible consistency!';
    if (streak < 100) return 'Learning machine!';
    return 'Legendary learner!';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-800">Current Streak</h3>
            <span className="text-2xl">{getStreakEmoji(streakData.currentStreak)}</span>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {streakData.currentStreak}
          </div>
          <div className="text-sm text-orange-700">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs text-orange-600 mt-2">
            {getStreakMessage(streakData.currentStreak)}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800">Longest Streak</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {streakData.longestStreak}
          </div>
          <div className="text-sm text-purple-700">
            {streakData.longestStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs text-purple-600 mt-2">
            Personal best record!
          </div>
        </div>

        {/* Total Active Days */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Total Active Days</h3>
            <span className="text-2xl">📚</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {streakData.totalDays}
          </div>
          <div className="text-sm text-green-700">
            {streakData.totalDays === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs text-green-600 mt-2">
            Learning journey progress
          </div>
        </div>
      </div>

      {/* Weekly and Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📊 This Week</h3>
            <span className="text-2xl">📅</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Days</span>
              <span className="font-semibold text-blue-600">{weeklyStats.weeklyDays}/7</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Activities</span>
              <span className="font-semibold text-green-600">{weeklyStats.weeklyCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Average</span>
              <span className="font-semibold text-purple-600">{weeklyStats.averagePerDay}</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Weekly Progress</span>
                <span>{Math.round((weeklyStats.weeklyDays / 7) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(weeklyStats.weeklyDays / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📈 This Month</h3>
            <span className="text-2xl">🗓️</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Days</span>
              <span className="font-semibold text-blue-600">{monthlyStats.monthlyDays}/30</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Activities</span>
              <span className="font-semibold text-green-600">{monthlyStats.monthlyCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Average</span>
              <span className="font-semibold text-purple-600">{monthlyStats.averagePerDay}</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Monthly Progress</span>
                <span>{Math.round((monthlyStats.monthlyDays / 30) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(monthlyStats.monthlyDays / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="text-center">
          <div className="text-4xl mb-2">{getStreakEmoji(streakData.currentStreak)}</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {getStreakMessage(streakData.currentStreak)}
          </h3>
          <p className="text-sm text-gray-600">
            {streakData.currentStreak === 0 
              ? "Complete any learning activity today to start your streak!"
              : `Keep learning daily to maintain your ${streakData.currentStreak}-day streak!`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreakStats;