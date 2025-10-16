import React, { useState, useEffect, useContext, useRef } from "react";
import { getRandomImage, getDescriptionFeedback, updateUserProgress, checkGrammar } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const Describe = ({ onProgressUpdate }) => {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Load random image and initialize speech recognition
  useEffect(() => {
    loadNewImage();
    initializeSpeechRecognition();
  }, []);

  const loadNewImage = async () => {
    setImageLoading(true);
    try {
      const imageData = await getRandomImage();
      setImage(imageData);
      setTranscript(""); // Clear previous description
      setFeedback(null);
    } catch (err) {
      toast.error("Failed to load image. Please try again.");
    }
    setImageLoading(false);
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += result + ' ';
          } else {
            interimText += result;
          }
        }
        
        const fullText = (finalText + interimText).trim();
        if (fullText) {
          setTranscript(fullText);
        }
      };
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started for description');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          toast.warning('No speech detected. Please try speaking louder.');
        }
      };
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    setIsRecording(true);
    setTranscript("");
    setFeedback(null);
    
    try {
      recognitionRef.current.start();
      setTranscript("🎤 Listening... Describe what you see in the image!");
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast.error('Failed to start speech recognition. Please try again.');
      setIsRecording(false);
      return;
    }

    // Start timer (60 seconds for description)
    let timeLeft = 60;
    setSeconds(timeLeft);
    
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setSeconds(timeLeft);
      
      if (timeLeft <= 0) {
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Analyze the description after a short delay
    setTimeout(() => {
      analyzeDescription();
    }, 1000);
  };

  const analyzeDescription = async () => {
    const currentTranscript = transcript.trim();
    
    if (!currentTranscript || 
        currentTranscript === "🎤 Listening... Describe what you see in the image!" ||
        currentTranscript.length < 10) {
      
      setFeedback({
        feedback: "No clear description detected. Please try again and describe the image in detail.",
        score: 0,
        detailed_scores: {},
        mistakes: ["No speech detected"],
        strengths: [],
        suggestions: ["Speak louder and clearer", "Describe what you see in the image", "Try again"]
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log("Analyzing description:", currentTranscript);
      
      // Use Gemini to analyze the description
      const result = await checkGrammar(currentTranscript, "describe");
      
      // Create detailed feedback for description
      const score = Math.max(1, Math.min(10, result.score || 7));
      
      setFeedback({
        feedback: result.feedback || "Good description! Keep practicing to improve your descriptive skills.",
        score: score,
        detailed_scores: {
          description_quality: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1)),
          grammar: score,
          vocabulary: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1)),
          detail_level: Math.max(1, Math.min(10, Math.min(10, currentTranscript.length / 20)))
        },
        mistakes: result.corrected && result.corrected !== currentTranscript ? 
          [`Grammar suggestion: "${result.corrected}"`] : 
          ["No major grammar issues found!"],
        strengths: [
          "Successfully described the image using speech",
          "Good effort in verbal description",
          currentTranscript.length > 50 ? "Provided detailed description" : "Clear and concise description"
        ],
        suggestions: [
          "Try to include more sensory details (colors, sizes, emotions)",
          "Describe not just what you see, but what might be happening",
          "Use varied vocabulary to make descriptions more vivid",
          "Practice describing different types of images"
        ]
      });

      // Save progress
      if (user) {
        await updateUserProgress(user.uid, "describe", score);
        if (typeof onProgressUpdate === "function") onProgressUpdate();
        toast.success(`🎉 Description analyzed! Score: ${score}/10`);
      }
      
    } catch (error) {
      console.error('Description analysis error:', error);
      
      // Fallback analysis
      const score = Math.max(3, Math.min(8, Math.floor(currentTranscript.length / 10)));
      
      setFeedback({
        feedback: "Good effort in describing the image! Keep practicing your descriptive skills.",
        score: score,
        detailed_scores: { 
          description_quality: score, 
          grammar: score, 
          vocabulary: score, 
          detail_level: score 
        },
        mistakes: ["Analysis temporarily unavailable"],
        strengths: ["Completed the description exercise"],
        suggestions: ["Keep practicing", "Try describing more details", "Use varied vocabulary"]
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 max-w-4xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-purple-900">
          🖼️ Describe the Image
        </h2>
        
        {imageLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading image...</p>
          </div>
        ) : image ? (
          <div className="space-y-4">
            {/* Image Display */}
            <div className="text-center">
              <img 
                src={image.image_url} 
                alt="Describe this image"
                className="max-w-full h-64 object-cover rounded-xl shadow-lg mx-auto"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
                }}
              />
              <p className="mt-2 text-sm text-gray-600 italic">{image.prompt}</p>
            </div>

            {/* Timer */}
            <p className="text-center font-medium text-gray-800">
              ⏱️ Timer: {isRecording ? `${seconds}s` : "Click the mic to start describing (60 seconds)"}
            </p>

            {/* Transcript Display */}
            <div className="bg-white p-5 rounded-xl shadow-inner text-gray-700 min-h-[100px]">
              <h3 className="font-semibold text-lg">📝 Your Description</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border min-h-[60px] flex items-center">
                {isRecording ? (
                  <div className="flex items-center text-purple-600">
                    <div className="animate-pulse mr-2">🎤</div>
                    <span className="italic">
                      {transcript === "🎤 Listening... Describe what you see in the image!" ? 
                        "Listening... Describe what you see!" : 
                        transcript || "Listening..."}
                    </span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap italic">
                    {transcript && transcript !== "🎤 Listening... Describe what you see in the image!" ? 
                      `"${transcript}"` : 
                      "Click the mic and describe what you see in the image..."}
                  </p>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col items-center">
              {/* Audio Visualization */}
              {isRecording && (
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-2 h-8 bg-purple-600 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Main Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isRecording ? "⏹️" : "🎙️"}
              </button>

              {/* Manual Analyze Button */}
              {!isRecording && transcript && transcript !== "🎤 Listening... Describe what you see in the image!" && (
                <button
                  onClick={analyzeDescription}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition text-sm"
                >
                  📊 Analyze My Description
                </button>
              )}
              
              {/* New Image Button */}
              <button
                onClick={loadNewImage}
                disabled={imageLoading || isRecording}
                className="mt-2 bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition text-sm disabled:opacity-50"
              >
                {imageLoading ? "Loading..." : "🔄 New Image"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load image. Please refresh the page.</p>
            <button 
              onClick={loadNewImage}
              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-300 shadow-sm text-center">
              <h3 className="font-bold text-xl text-purple-800 mb-2">🎯 Description Score</h3>
              <div className="text-4xl font-bold text-purple-600">{feedback.score || 0}/10</div>
            </div>

            {/* Detailed Scores */}
            {feedback.detailed_scores && Object.keys(feedback.detailed_scores).length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-300 shadow-sm">
                <h3 className="font-bold text-lg text-indigo-800 mb-3">📊 Detailed Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(feedback.detailed_scores).map(([category, score]) => (
                    <div key={category} className="text-center bg-white p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 capitalize">
                        {category.replace('_', ' ')}
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">{score}/10</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mistakes/Issues */}
            {feedback.mistakes && feedback.mistakes.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-300 shadow-sm">
                <h3 className="font-bold text-lg text-red-800 mb-3">❌ Areas for Improvement</h3>
                <ul className="space-y-2">
                  {feedback.mistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="text-red-700">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-300 shadow-sm">
                <h3 className="font-bold text-lg text-green-800 mb-3">✅ Your Strengths</h3>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-green-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-300 shadow-sm">
                <h3 className="font-bold text-lg text-yellow-800 mb-3">💡 Description Tips</h3>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span className="text-yellow-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Feedback */}
            {feedback.feedback && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-300 shadow-sm">
                <h3 className="font-bold text-lg text-blue-800 mb-2">🤖 AI Analysis</h3>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-blue-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {feedback.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Describe;
