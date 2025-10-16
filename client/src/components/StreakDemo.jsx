import React from 'react';

const StreakDemo = () => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🔥 Streak System</h3>
        <p className="text-gray-600 text-sm">Track your daily learning progress !</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-2">📅</div>
          <h4 className="font-semibold text-gray-800">Daily Tracking</h4>
          <p className="text-sm text-gray-600">Each day you practice gets marked on your calendar</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-2">🔥</div>
          <h4 className="font-semibold text-gray-800">Streak Counter</h4>
          <p className="text-sm text-gray-600">See your current and longest learning streaks</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-2">🏆</div>
          <h4 className="font-semibold text-gray-800">Achievements</h4>
          <p className="text-sm text-gray-600">Unlock badges for consistent learning</p>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Complete any learning activity (Speaking, Writing, or Describing) to start your streak!
        </p>
      </div>
    </div>
  );
};

export default StreakDemo;