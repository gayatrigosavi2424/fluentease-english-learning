// File: client/src/services/api.js
import axios from "axios";
import { updateUserProgress as updateProgressFirebase } from "./progress";

// Determine backend URL based on environment
const getBackendURL = () => {
  // If we're on Vercel (production), use the deployed backend
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://fluentease-english-learning.onrender.com';
  }
  
  // Check for environment variable
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Default to localhost for development
  return 'http://127.0.0.1:8000';
};

const BASE_URL = getBackendURL();

// Debug: Log the backend URL being used
console.log("🔧 Backend URL:", BASE_URL);
console.log("🔧 Hostname:", window.location.hostname);
console.log("🔧 Environment:", import.meta.env.MODE);

/**
 * Check grammar for a given text
 * @param {string} text
 * @param {string} context - "write" or "speak" for context
 * @returns {Object} { corrected_text, feedback, score }
 */
export const checkGrammar = async (text, context = "write") => {
  try {
    const response = await axios.post(`${BASE_URL}/grammar/check`, { text });
    return {
      corrected: response.data.corrected_text,
      feedback: response.data.feedback,
      score: response.data.score
    };
  } catch (err) {
    console.error("❌ Grammar check failed:", err);
    throw err;
  }
};

/**
 * Send recorded audio to backend for transcription
 * @param {Blob} audioBlob
 * @returns {Object} { transcript }
 */
export const sendAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    const response = await axios.post(`${BASE_URL}/speak/feedback`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data; // { transcript, score, feedback }
  } catch (err) {
    console.error("❌ Audio send failed:", err);
    throw err;
  }
};

/**
 * Get random image for description practice
 * @returns {Object} { image_url, description, prompt }
 */
export const getRandomImage = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/describe/image`);
    return response.data;
  } catch (err) {
    console.error("❌ Failed to get image:", err);
    throw err;
  }
};

/**
 * Send description text for feedback
 * @param {string} text - Description text
 * @returns {Object} { feedback, score }
 */
export const getDescriptionFeedback = async (text) => {
  try {
    const response = await axios.post(`${BASE_URL}/describe/feedback`, { text });
    return response.data;
  } catch (err) {
    console.error("❌ Description feedback failed:", err);
    throw err;
  }
};

/**
 * Update user progress in backend (FastAPI + Firebase)
 * @param {string} uid - User ID
 * @param {string} section - "speak", "write", "describe"
 * @param {number} score - 0-10
 */
export const updateUserProgress = async (uid, section, score) => {
  try {
    // Update Firebase
    await updateProgressFirebase(uid, section, score);

    // Optionally: update backend if needed
    // await axios.post(`${BASE_URL}/progress/update`, { uid, section, score });

    console.log(`✅ Updated ${section} score for user ${uid}: ${score}`);
  } catch (err) {
    console.error("❌ Failed to update user progress:", err);
    // Don't throw error - let the app continue working with local storage fallback
    console.log("📝 Progress saved locally as fallback");
  }
};
