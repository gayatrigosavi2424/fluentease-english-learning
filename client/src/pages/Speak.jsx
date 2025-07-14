import React, { useState, useRef, useEffect, useContext } from "react";
import { sendAudio, checkGrammar } from "../services/api";
import { motion } from "framer-motion";
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { speakTopics } from "../utils/topics";
import { toast } from "react-toastify";

export default  function Speak({ onProgressUpdate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [topic, setTopic] = useState(speakTopics[0]);
  const [seconds, setSeconds] = useState(20);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const { user } = useContext(AuthContext);
  const audioRef = useRef();

  useEffect(() => {
    const randomTopic = speakTopics[Math.floor(Math.random() * speakTopics.length)];
    setTopic(randomTopic);
  }, []);

  const handleStartRecording = async () => {
    setTranscript("Recording...");
    setFeedback(null);
    setIsRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    let currentTime = 20;
    setSeconds(currentTime);

    timerRef.current = setInterval(() => {
      currentTime -= 1;
      setSeconds(currentTime);

      if (currentTime <= 0) {
        clearInterval(timerRef.current);
        if (mediaRecorderRef.current?.state === "recording") {
          handleStopRecording();
        }
      }
    }, 1000);

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      clearInterval(timerRef.current);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });

      try {
        const result = await sendAudio(audioBlob);
        setTranscript(result.transcript);

        const grammarResult = await checkGrammar(result.transcript);
        setFeedback(grammarResult.feedback);

       if (user && grammarResult?.score !== undefined) {
  await updateUserProgress(user.uid, "speak", grammarResult.score);
  if (typeof onProgressUpdate === "function") onProgressUpdate();

  // ✅ Show success toast
  toast.success("🎉 Progress saved successfully!");
}
      } catch (err) {
        setTranscript("Transcription failed.");
        setFeedback("Something went wrong with the analysis.");
      }
    };

    mediaRecorderRef.current.start();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-100 to-blue-100 px-4">
      <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-10 max-w-3xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-800">🎤 Speak on Topic</h2>
        <p className="text-center text-gray-600 text-lg">
          Topic: <strong>{topic}</strong>
        </p>

        <p className="text-center font-medium text-gray-800">⏱️ Timer: {isRecording ? `${seconds}s` : "Click the mic to start"}</p>

        <div className="bg-white p-5 rounded-xl shadow-inner text-gray-700 min-h-[80px]">
          <h3 className="font-semibold text-lg">📝 Transcript</h3>
          <p className="mt-2 whitespace-pre-wrap">{transcript || "Click the mic and start speaking..."}</p>
        </div>

        <div className="flex flex-col items-center">
          {isRecording && (
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-2 h-8 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          )}

          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRecording ? "⏹️" : "🎙️"}
          </button>
        </div>

        {feedback && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-300 shadow-sm text-gray-800 whitespace-pre-wrap">
            <h3 className="font-semibold mb-2 text-lg">📊 AI Feedback</h3>
            {feedback.split("\n").map((line, i) => (
              <p key={i} className="mb-1">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
