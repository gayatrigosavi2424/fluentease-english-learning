import React, { useState, useContext } from 'react';
import { checkGrammar } from '../services/api';
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Write({ onProgressUpdate }) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleCheck = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setFeedback('');
    try {
      const res = await checkGrammar(text);
      setFeedback(res.feedback);

      if (user && res && res.score !== undefined) {
  await updateUserProgress(user.uid, "write", res.score);
  if (typeof onProgressUpdate === "function") onProgressUpdate();

  toast.success("✅ Write score updated!");
}
    } catch (err) {
      setFeedback("⚠️ Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 max-w-3xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-900">✍️ Write on Topic</h2>
        <p className="text-center text-gray-700">Topic: <strong>Describe your favorite festival</strong></p>

        <textarea
          rows="6"
          placeholder="Start writing here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-inner resize-none"
        ></textarea>

        <button
          onClick={handleCheck}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          {loading ? "Checking..." : "Check Grammar"}
        </button>

        {feedback && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-300 shadow-sm text-gray-800 whitespace-pre-wrap">
            <h3 className="font-semibold mb-2 text-lg">📊 AI Feedback</h3>
            {feedback.split('\n').map((line, i) => (
              <p key={i} className="mb-1">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
