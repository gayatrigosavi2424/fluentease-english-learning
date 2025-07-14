// File: client/src/services/progress.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Save or update the user's progress for a specific section
 * - Merges score updates with existing progress
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
  } catch (err) {
    console.error("❌ Failed to update progress:", err);
    throw err;
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
    console.error("❌ Failed to fetch progress:", err);
    return {};
  }
};
