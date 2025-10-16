// File: client/src/services/progress.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { updateUserStreak } from "./streaks";

/**
 * Save or update the user's progress for a specific section
 * - Merges score updates with existing progress
 * - Updates streak data when user completes an activity
 */
export const updateUserProgress = async (uid, section, score) => {
  try {
    const userRef = doc(db, "progress", uid);
    await setDoc(
      userRef,
      { [section]: score },
      { merge: true } // ✅ Ensures existing data isn't overwritten
    );
    console.log(`✅ Updated ${section} score to ${score} for user ${uid}`);
    
    // Update streak data when user completes an activity
    try {
      await updateUserStreak(uid, section);
      console.log(`✅ Updated streak for ${section} activity`);
    } catch (streakErr) {
      console.error("❌ Failed to update streak:", streakErr);
      // Don't throw error - progress update should still succeed
    }
    
  } catch (err) {
    console.error("❌ Failed to update progress to Firebase:", err);
    
    // Fallback: Save to localStorage
    try {
      const localProgress = JSON.parse(localStorage.getItem(`progress_${uid}`) || '{}');
      localProgress[section] = Math.max(localProgress[section] || 0, score);
      localStorage.setItem(`progress_${uid}`, JSON.stringify(localProgress));
      console.log(`✅ Saved progress locally as fallback for user ${uid}`);
      
      // Try to update streak even with local storage fallback
      try {
        await updateUserStreak(uid, section);
      } catch (streakErr) {
        console.error("❌ Failed to update streak with local fallback:", streakErr);
      }
      
    } catch (localErr) {
      console.error("❌ Failed to save progress locally:", localErr);
      throw new Error("Failed to save progress both online and locally");
    }
  }
};

/**
 * Get all progress for a specific user
 * @returns {Object} e.g. { speak: 8, write: 7, describe: 6 }
 */
export const getUserProgress = async (uid) => {
  try {
    const userRef = doc(db, "progress", uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      console.log("📊 Fetched user progress:", data);
      return data;
    } else {
      console.warn("⚠️ No progress found for user:", uid);
      return {};
    }
  } catch (err) {
    console.error("❌ Failed to fetch progress from Firebase:", err);
    
    // Fallback: Get from localStorage
    try {
      const localProgress = JSON.parse(localStorage.getItem(`progress_${uid}`) || '{}');
      console.log("📊 Fetched progress from local storage:", localProgress);
      return localProgress;
    } catch (localErr) {
      console.error("❌ Failed to fetch progress from local storage:", localErr);
      return {};
    }
  }
};
