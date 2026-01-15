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
      
      // Use the describe feedback endpoint
      const result = await getDescriptionFeedback(currentTranscript);
      
      // Create detailed feedback for description
      const score = Math.max(1, Math.min(10, result.score || 7));
      
      setFeedback({
        aiFeedback: result.feedback || null,
        correctedText: currentTranscript,
        score: score,
        detailed_scores: {
          description_quality: Math.max(1, Math.min(10, score)),
          grammar: Math.max(1, Math.min(10, score)),
          vocabulary: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1)),
          detail_level: Math.max(1, Math.min(10, Math.min(10, currentTranscript.length / 20)))
        },
        exactMistakes: []
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
        aiFeedback: null,
        correctedText: currentTranscript,
        score: score,
        detailed_scores: { 
          description_quality: score, 
          grammar: score, 
          vocabulary: score, 
          detail_level: score 
        },
        exactMistakes: []
      });
      
      toast.warning('Using local analysis - AI temporarily unavailable');
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
              <h3 className="font-bold text-xl text-purple-800 mb-2">🎯 Your Score</h3>
              <div className="text-4xl font-bold text-purple-600">{feedback.score || 0}/10</div>
            </div>

            {/* AI Feedback from Gemini - MAIN SECTION */}
            {feedback.aiFeedback && (
              <div className="bg-white p-6 rounded-xl border-2 border-purple-300 shadow-lg">
                <h3 className="font-bold text-xl text-purple-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🤖</span>
                  AI Grammar & Fluency Analysis
                </h3>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {feedback.aiFeedback}
                  </div>
                </div>
              </div>
            )}

            {/* Exact Grammar Mistakes */}
            {feedback.exactMistakes && feedback.exactMistakes.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-300 shadow-sm">
                <h3 className="font-bold text-lg text-red-800 mb-3">
                  ❌ Grammar Mistakes Found: {feedback.exactMistakes.length}
                </h3>
                <div className="space-y-3">
                  {feedback.exactMistakes.map((mistake, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-sm">{mistake.type}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">❌</span>
                          <span className="text-red-700 font-medium">{mistake.wrong}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✅</span>
                          <span className="text-green-700 font-medium">{mistake.correct}</span>
                        </div>
                        <div className="ml-6 mt-1">
                          <span className="text-blue-700 text-sm">{mistake.rule}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Mistakes Message - Only show if score is actually good */}
            {(!feedback.exactMistakes || feedback.exactMistakes.length === 0) && !feedback.aiFeedback && feedback.score >= 7 && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-300 shadow-sm text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Excellent Description!</h3>
                <p className="text-green-700">No grammar or fluency errors detected. Keep up the great work!</p>
              </div>
            )}
            
            {/* Poor Response Message - Show if score is low */}
            {feedback.score < 5 && (!feedback.exactMistakes || feedback.exactMistakes.length === 0) && !feedback.aiFeedback && (
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-300 shadow-sm text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-xl font-bold text-orange-800 mb-2">Incomplete Description</h3>
                <p className="text-orange-700">Your description seems too short or incomplete. Try describing more details about the image!</p>
              </div>
            )}

            {/* Detailed Scores */}
            {feedback.detailed_scores && Object.keys(feedback.detailed_scores).length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-300 shadow-sm">
                <h3 className="font-bold text-lg text-indigo-800 mb-3">📊 Detailed Scores</h3>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Describe;
