import React, { useState, useEffect, useContext } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { checkGrammar } from "../services/api";
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const imageList = [
  "https://images.unsplash.com/photo-1508780709619-79562169bc64",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", // ✅ fixed typo from unsplash.acom
  "https://images.unsplash.com/photo-1496483648148-47c686dc86a8",
];

export default function Describe({ onProgressUpdate }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(20);
  const [recording, setRecording] = useState(false);
  const [image, setImage] = useState("");
  const { user } = useContext(AuthContext);
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  // Pick a random image on load
  useEffect(() => {
    const random = Math.floor(Math.random() * imageList.length);
    setImage(imageList[random]);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (recording && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }

    if (timer === 0 && recording) {
      stopRecording();
    }

    return () => clearInterval(interval);
  }, [recording, timer]);

  const startRecording = () => {
    setRecording(true);
    resetTranscript();
    setTimer(20);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopRecording = async () => {
    SpeechRecognition.stopListening();
    setRecording(false);
    setTimer(0);
    await handleCheck(transcript);
  };

  const handleMicClick = () => {
    if (!recording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleCheck = async (text) => {
    setLoading(true);
    setFeedback("");

    try {
      const res = await checkGrammar(text);
      setFeedback(res.feedback);

      if (user && res.score !== undefined) {
  await updateUserProgress(user.uid, "describe", res.score);
  if (typeof onProgressUpdate === "function") onProgressUpdate();

  toast.success("📸 Describe progress updated!");
}
    } catch (err) {
      setFeedback("⚠️ Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 max-w-3xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-indigo-900">🎤 Speak on the Picture</h2>

        <div className="flex justify-center">
          <img src={image} alt="Prompt" className="rounded-xl w-full max-h-[300px] object-cover" />
        </div>

        <div className="text-center text-xl font-medium">
          ⏱️ Timer: <span className="text-red-600">{timer}s</span>
        </div>

        <button
          onClick={handleMicClick}
          className={`px-6 py-3 rounded-lg text-white shadow transition ${
            recording ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {recording ? "🛑 Stop" : "🎙️ Start Speaking"}
        </button>

        {transcript && (
          <div className="bg-gray-100 p-4 rounded-xl text-gray-700 mt-4 whitespace-pre-wrap">
            <h3 className="font-semibold">📝 Transcript</h3>
            {transcript}
          </div>
        )}

        {loading && <p className="text-center text-blue-600 font-medium">Analyzing...</p>}

        {feedback && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-300 shadow-sm text-gray-800 whitespace-pre-wrap">
            <h3 className="font-semibold mb-2 text-lg">📊 AI Feedback</h3>
            {feedback.split("\n").map((line, i) => (
              <p key={i} className="mb-1">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
