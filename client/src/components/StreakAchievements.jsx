import React, { useState, useEffect } from 'react';
import { getUserStreaks } from '../services/streaks';

const StreakAchievements = ({ userId }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const streakData = await getUserStreaks(userId);
      const userAchievements = calculateAchievements(streakData);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (streakData) => {
    const achievements = [
      {
        id: 'first_day',
        title: 'First Steps',
        description: 'Complete your first learning activity',
        emoji: '🌱',
        requirement: 1,
        current: streakData.totalDays,
        type: 'total_days',
        unlocked: streakData.totalDays >= 1
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        emoji: '🔥',
        requirement: 7,
        current: streakData.currentStreak,
        type: 'current_streak',
        unlocked: streakData.currentStreak >= 7
      },
      {
        id: 'consistency_king',
        title: 'Consistency King',
        description: 'Learn for 30 consecutive days',
        emoji: '👑',
        requirement: 30,
        current: streakData.currentStreak,
        type: 'current_streak',
        unlocked: streakData.currentStreak >= 30
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Reach a 100-day learning streak',
        emoji: '💎',
        requirement: 100,
        current: streakData.longestStreak,
        type: 'longest_streak',
        unlocked: streakData.longestStreak >= 100
      },
      {
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: 'Learn for 50 total days',
        emoji: '📚',
        requirement: 50,
        current: streakData.totalDays,
        type: 'total_days',
        unlocked: streakData.totalDays >= 50
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Achieve a 14-day streak',
        emoji: '⚡',
        requirement: 14,
        current: streakData.longestStreak,
        type: 'longest_streak',
        unlocked: streakData.longestStreak >= 14
      },
      {
        id: 'learning_legend',
        title: 'Learning Legend',
        description: 'Learn for 365 consecutive days',
        emoji: '🏆',
        requirement: 365,
        current: streakData.longestStreak,
        type: 'longest_streak',
        unlocked: streakData.longestStreak >= 365
      },
      {
        id: 'hundred_days',
        title: 'Hundred Days',
        description: 'Complete 100 total learning days',
        emoji: '🎯',
        requirement: 100,
        current: streakData.totalDays,
        type: 'total_days',
        unlocked: streakData.totalDays >= 100
      }
    ];

    return achievements.sort((a, b) => {
      // Sort by unlocked status first, then by requirement
      if (a.unlocked !== b.unlocked) {
        return b.unlocked - a.unlocked;
      }
      return a.requirement - b.requirement;
    });
  };

  const getProgressPercentage = (current, requirement) => {
    return Math.min((current / requirement) * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🏆 Learning Achievements
        </h3>
        <p className="text-sm text-gray-600">
          Unlock badges by maintaining consistent learning habits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              achievement.unlocked
                ? 'border-green-200 bg-green-50 shadow-sm'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <span className={`text-2xl mr-3 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.emoji}
                </span>
                <div>
                  <h4 className={`font-semibold ${
                    achievement.unlocked ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
              {achievement.unlocked && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  ✓ Unlocked
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{achievement.current}/{achievement.requirement}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    achievement.unlocked ? 'bg-green-500' : 'bg-blue-400'
                  }`}
                  style={{ width: `${getProgressPercentage(achievement.current, achievement.requirement)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <h4 className="font-semibold text-gray-800 mb-2">Achievement Progress</h4>
          <div className="flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-green-600 font-semibold">
                {achievements.filter(a => a.unlocked).length}
              </span>
              <span className="text-gray-600 ml-1">unlocked</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center">
              <span className="text-blue-600 font-semibold">
                {achievements.length - achievements.filter(a => a.unlocked).length}
              </span>
              <span className="text-gray-600 ml-1">remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakAchievements;