// Streak tracking system for English learning app
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * Get user's streak data
 * @param {string} userId 
 * @returns {Object} streak data
 */
export const getUserStreaks = async (userId) => {
  try {
    const streakDoc = await getDoc(doc(db, 'streaks', userId));
    
    if (!streakDoc.exists()) {
      // Initialize streak data for new user
      const initialData = {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        lastActivityDate: null,
        activities: {}, // { "2024-01-15": { speak: true, write: true, describe: false, count: 2 } }
        streakHistory: [] // Array of streak periods
      };
      
      await setDoc(doc(db, 'streaks', userId), initialData);
      return initialData;
    }
    
    return streakDoc.data();
  } catch (error) {
    console.error('Error getting user streaks:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      lastActivityDate: null,
      activities: {},
      streakHistory: []
    };
  }
};

/**
 * Update user streak when they complete an activity
 * @param {string} userId 
 * @param {string} activityType - 'speak', 'write', 'describe'
 */
export const updateUserStreak = async (userId, activityType) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const streakData = await getUserStreaks(userId);
    
    // Initialize today's activities if not exists
    if (!streakData.activities[today]) {
      streakData.activities[today] = {
        speak: false,
        write: false,
        describe: false,
        count: 0,
        date: today
      };
    }
    
    // Mark activity as completed for today
    if (!streakData.activities[today][activityType]) {
      streakData.activities[today][activityType] = true;
      streakData.activities[today].count += 1;
    }
    
    // Calculate streaks
    const updatedStreakData = calculateStreaks(streakData, today);
    
    // Save to Firebase
    await setDoc(doc(db, 'streaks', userId), updatedStreakData);
    
    return updatedStreakData;
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
};

/**
 * Calculate current and longest streaks
 * @param {Object} streakData 
 * @param {string} today 
 * @returns {Object} updated streak data
 */
const calculateStreaks = (streakData, today) => {
  const activities = streakData.activities;
  const sortedDates = Object.keys(activities).sort();
  
  if (sortedDates.length === 0) {
    return streakData;
  }
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = streakData.longestStreak || 0;
  let tempStreak = 0;
  
  // Start from today and go backwards to find current streak
  const todayDate = new Date(today);
  let checkDate = new Date(todayDate);
  
  // Check current streak (consecutive days from today backwards)
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (activities[dateStr] && activities[dateStr].count > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate longest streak by checking all consecutive periods
  let maxStreak = 0;
  let currentTempStreak = 0;
  
  // Sort all dates and check for consecutive days
  const allDates = sortedDates.filter(date => activities[date].count > 0);
  
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      currentTempStreak = 1;
    } else {
      const prevDate = new Date(allDates[i - 1]);
      const currDate = new Date(allDates[i]);
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentTempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentTempStreak);
        currentTempStreak = 1;
      }
    }
  }
  maxStreak = Math.max(maxStreak, currentTempStreak);
  
  // Update streak data
  return {
    ...streakData,
    currentStreak,
    longestStreak: Math.max(longestStreak, maxStreak),
    totalDays: allDates.length,
    lastActivityDate: today,
    activities
  };
};

/**
 * Get streak calendar data for visualization (like GitHub)
 * @param {string} userId 
 * @param {number} days - number of days to show (default 365)
 * @returns {Array} calendar data
 */
export const getStreakCalendar = async (userId, days = 365) => {
  try {
    const streakData = await getUserStreaks(userId);
    const activities = streakData.activities;
    
    const calendar = [];
    const today = new Date();
    
    // Generate calendar for the last 'days' days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = activities[dateStr] || { count: 0, speak: false, write: false, describe: false };
      
      calendar.push({
        date: dateStr,
        count: dayData.count,
        level: getActivityLevel(dayData.count), // 0-4 for different colors
        activities: {
          speak: dayData.speak || false,
          write: dayData.write || false,
          describe: dayData.describe || false
        },
        dayOfWeek: date.getDay(),
        month: date.getMonth(),
        day: date.getDate()
      });
    }
    
    return calendar;
  } catch (error) {
    console.error('Error getting streak calendar:', error);
    return [];
  }
};

/**
 * Get activity level for coloring (like GitHub)
 * @param {number} count 
 * @returns {number} level 0-4
 */
const getActivityLevel = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4; // 3+ activities
};

/**
 * Get weekly streak stats
 * @param {string} userId 
 * @returns {Object} weekly stats
 */
export const getWeeklyStats = async (userId) => {
  try {
    const streakData = await getUserStreaks(userId);
    const activities = streakData.activities;
    
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let weeklyCount = 0;
    let weeklyDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (activities[dateStr] && activities[dateStr].count > 0) {
        weeklyCount += activities[dateStr].count;
        weeklyDays++;
      }
    }
    
    return {
      weeklyCount,
      weeklyDays,
      averagePerDay: weeklyDays > 0 ? (weeklyCount / weeklyDays).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return { weeklyCount: 0, weeklyDays: 0, averagePerDay: 0 };
  }
};

/**
 * Get monthly streak stats
 * @param {string} userId 
 * @returns {Object} monthly stats
 */
export const getMonthlyStats = async (userId) => {
  try {
    const streakData = await getUserStreaks(userId);
    const activities = streakData.activities;
    
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    let monthlyCount = 0;
    let monthlyDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (activities[dateStr] && activities[dateStr].count > 0) {
        monthlyCount += activities[dateStr].count;
        monthlyDays++;
      }
    }
    
    return {
      monthlyCount,
      monthlyDays,
      averagePerDay: monthlyDays > 0 ? (monthlyCount / monthlyDays).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return { monthlyCount: 0, monthlyDays: 0, averagePerDay: 0 };
  }
};