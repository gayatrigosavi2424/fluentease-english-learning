import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { checkGrammar } from "../services/api";
import { motion } from "framer-motion";
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

// CEFR Level System
const CEFR_LEVELS = {
  A1: { name: "Beginner", color: "bg-green-100 text-green-800", tasks: ["basic_description", "simple_introduction"] },
  A2: { name: "Elementary", color: "bg-blue-100 text-blue-800", tasks: ["daily_routine", "personal_preferences"] },
  B1: { name: "Intermediate", color: "bg-yellow-100 text-yellow-800", tasks: ["opinion_expression", "experience_sharing"] },
  B2: { name: "Upper-Intermediate", color: "bg-orange-100 text-orange-800", tasks: ["complex_description", "argumentation"] },
  C1: { name: "Advanced", color: "bg-red-100 text-red-800", tasks: ["presentation", "debate"] },
  C2: { name: "Proficient", color: "bg-purple-100 text-purple-800", tasks: ["academic_discussion", "professional_presentation"] }
};

// Task Categories
const TASK_CATEGORIES = {
  basic_description: {
    title: "Describe the Image",
    instruction: "Look at the image and describe what you see in detail.",
    duration: 60,
    level: "A1"
  },
  simple_introduction: {
    title: "Introduce Yourself",
    instruction: "Tell us about yourself, your hobbies, and your interests.",
    duration: 45,
    level: "A1"
  },
  daily_routine: {
    title: "Daily Routine",
    instruction: "Describe your typical day from morning to evening.",
    duration: 90,
    level: "A2"
  },
  opinion_expression: {
    title: "Express Your Opinion",
    instruction: "Share your thoughts on the given topic and explain your reasoning.",
    duration: 120,
    level: "B1"
  }
};

export default function SpeakAdvanced({ onProgressUpdate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [realTimeTranscript, setRealTimeTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [userLevel, setUserLevel] = useState("A1");
  const [seconds, setSeconds] = useState(60);
  const [isListening, setIsListening] = useState(false);
  const [pronunciationScores, setPronunciationScores] = useState([]);
  const [fluencyMetrics, setFluencyMetrics] = useState({});
  const [realTimeAnalysis, setRealTimeAnalysis] = useState({});
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Initialize advanced speech recognition
  useEffect(() => {
    initializeAdvancedSpeechRecognition();
    loadUserLevel();
    selectTaskForLevel();
  }, []);

  const loadUserLevel = async () => {
    // In a real app, this would come from user progress
    // For now, we'll determine level based on previous scores
    if (user) {
      // Logic to determine user's CEFR level based on performance
      setUserLevel("A2"); // Default for demo
    }
  };

  const selectTaskForLevel = () => {
    const levelTasks = Object.entries(TASK_CATEGORIES).filter(
      ([_, task]) => task.level === userLevel
    );
    const randomTask = levelTasks[Math.floor(Math.random() * levelTasks.length)];
    setCurrentTask(randomTask);
    setSeconds(randomTask[1].duration);
  };

  const initializeAdvancedSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Enhanced configuration
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives
      
      // Real-time results processing
      recognitionRef.current.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        const wordConfidences = [];
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          if (result.isFinal) {
            finalText += transcript + ' ';
            // Store word-level confidence scores
            transcript.split(' ').forEach(word => {
              wordConfidences.push({ word, confidence });
            });
          } else {
            interimText += transcript;
          }
        }
        
        const fullText = (finalText + interimText).trim();
        setTranscript(finalText.trim());
        setRealTimeTranscript(fullText);
        
        // Real-time analysis
        if (fullText) {
          performRealTimeAnalysis(fullText, wordConfidences);
        }
      };
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        initializeAudioAnalysis();
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  };

  const initializeAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      startAudioAnalysis();
    } catch (error) {
      console.error('Audio analysis initialization failed:', error);
    }
  };

  const startAudioAnalysis = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate audio metrics
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const pitch = calculatePitch(dataArray);
      
      setFluencyMetrics(prev => ({
        ...prev,
        volume,
        pitch,
        timestamp: Date.now()
      }));
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  const calculatePitch = (frequencyData) => {
    // Simplified pitch detection
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    return maxIndex * (audioContextRef.current?.sampleRate || 44100) / (2 * frequencyData.length);
  };

  const performRealTimeAnalysis = useCallback((text, wordConfidences) => {
    // Real-time pronunciation scoring
    const words = text.split(' ');
    const scores = wordConfidences.map(({ word, confidence }) => ({
      word,
      pronunciationScore: Math.round(confidence * 10),
      needsImprovement: confidence < 0.7
    }));
    
    setPronunciationScores(scores);
    
    // Real-time fluency analysis
    const wordsPerMinute = (words.length / (Date.now() - (timerRef.current?.startTime || Date.now()))) * 60000;
    const pauseCount = text.match(/\.\.\.|,|;/g)?.length || 0;
    
    setRealTimeAnalysis({
      wordsPerMinute: Math.round(wordsPerMinute),
      pauseCount,
      wordCount: words.length,
      averageConfidence: wordConfidences.reduce((sum, { confidence }) => sum + confidence, 0) / wordConfidences.length
    });
  }, []);

  const startAdvancedRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    setIsRecording(true);
    setTranscript("");
    setRealTimeTranscript("");
    setFeedback(null);
    setPronunciationScores([]);
    setRealTimeAnalysis({});
    
    try {
      recognitionRef.current.start();
      timerRef.current = { startTime: Date.now() };
      
      let timeLeft = currentTask ? currentTask[1].duration : 60;
      setSeconds(timeLeft);
      
      const countdown = setInterval(() => {
        timeLeft -= 1;
        setSeconds(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdown);
          stopAdvancedRecording();
        }
      }, 1000);
      
      timerRef.current.interval = countdown;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start speech recognition. Please try again.');
      setIsRecording(false);
    }
  };

  const stopAdvancedRecording = () => {
    setIsRecording(false);
    if (timerRef.current?.interval) {
      clearInterval(timerRef.current.interval);
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Process final analysis
    setTimeout(() => {
      performAdvancedAnalysis();
    }, 1000);
  };

  const performAdvancedAnalysis = async () => {
    if (!transcript || transcript.length < 10) {
      setFeedback({
        overall: { score: 0, band: "Below A1" },
        pronunciation: { score: 0, issues: ["No clear speech detected"] },
        fluency: { score: 0, wpm: 0 },
        grammar: { score: 0, mistakes: ["No speech to analyze"] },
        vocabulary: { score: 0, level: "Basic" },
        suggestions: ["Speak louder and clearer", "Try again with better audio"]
      });
      return;
    }

    try {
      // Get AI analysis
      const aiResult = await checkGrammar(transcript, "speak");
      
      // Calculate advanced metrics
      const analysis = calculateAdvancedMetrics(transcript, pronunciationScores, realTimeAnalysis);
      
      // Combine AI and local analysis
      const combinedFeedback = {
        overall: {
          score: analysis.overallScore,
          band: getCEFRBand(analysis.overallScore),
          improvement: analysis.improvement
        },
        pronunciation: {
          score: analysis.pronunciationScore,
          wordScores: pronunciationScores,
          issues: analysis.pronunciationIssues,
          strengths: analysis.pronunciationStrengths
        },
        fluency: {
          score: analysis.fluencyScore,
          wpm: realTimeAnalysis.wordsPerMinute || 0,
          pauseAnalysis: analysis.pauseAnalysis,
          rhythm: analysis.rhythmScore
        },
        grammar: {
          score: aiResult?.score || analysis.grammarScore,
          mistakes: analysis.grammarMistakes,
          corrections: aiResult?.corrected || transcript
        },
        vocabulary: {
          score: analysis.vocabularyScore,
          level: analysis.vocabularyLevel,
          suggestions: analysis.vocabularySuggestions
        },
        suggestions: analysis.overallSuggestions,
        nextLevel: analysis.nextLevel
      };
      
      setFeedback(combinedFeedback);
      
      // Save progress
      if (user) {
        await updateUserProgress(user.uid, "speak", analysis.overallScore);
        if (typeof onProgressUpdate === "function") onProgressUpdate();
        toast.success(`🎉 Analysis complete! Score: ${analysis.overallScore}/10`);
      }
      
    } catch (error) {
      console.error('Advanced analysis error:', error);
      // Fallback to basic analysis
      setFeedback({
        overall: { score: 6, band: "A2" },
        pronunciation: { score: 6, issues: ["Analysis temporarily unavailable"] },
        fluency: { score: 6, wpm: realTimeAnalysis.wordsPerMinute || 0 },
        grammar: { score: 6, mistakes: ["Analysis temporarily unavailable"] },
        vocabulary: { score: 6, level: "Intermediate" },
        suggestions: ["Keep practicing", "Try again later"]
      });
    }
  };

  const calculateAdvancedMetrics = (text, wordScores, fluencyData) => {
    const words = text.split(' ');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Pronunciation analysis
    const avgPronunciation = wordScores.length > 0 
      ? wordScores.reduce((sum, { pronunciationScore }) => sum + pronunciationScore, 0) / wordScores.length
      : 7;
    
    // Fluency analysis
    const wpm = fluencyData.wordsPerMinute || 0;
    const fluencyScore = Math.min(10, Math.max(1, (wpm / 150) * 10)); // 150 WPM = perfect
    
    // Grammar analysis (basic)
    const grammarScore = 8 - (text.match(/\b(i)\b/g)?.length || 0); // Simple check
    
    // Vocabulary analysis
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabularyScore = Math.min(10, (uniqueWords / words.length) * 15);
    
    // Overall score
    const overallScore = Math.round((avgPronunciation + fluencyScore + grammarScore + vocabularyScore) / 4);
    
    return {
      overallScore,
      pronunciationScore: Math.round(avgPronunciation),
      fluencyScore: Math.round(fluencyScore),
      grammarScore: Math.round(grammarScore),
      vocabularyScore: Math.round(vocabularyScore),
      pronunciationIssues: wordScores.filter(w => w.needsImprovement).map(w => w.word),
      pronunciationStrengths: wordScores.filter(w => !w.needsImprovement).map(w => w.word),
      pauseAnalysis: `${fluencyData.pauseCount || 0} pauses detected`,
      rhythmScore: Math.round(fluencyScore),
      grammarMistakes: ["Analysis based on AI feedback"],
      vocabularyLevel: getVocabularyLevel(vocabularyScore),
      vocabularySuggestions: ["Use more varied vocabulary", "Try complex sentence structures"],
      overallSuggestions: generateSuggestions(overallScore),
      nextLevel: getNextLevel(overallScore),
      improvement: "Keep practicing for better results"
    };
  };

  const getCEFRBand = (score) => {
    if (score >= 9) return "C2";
    if (score >= 8) return "C1";
    if (score >= 7) return "B2";
    if (score >= 6) return "B1";
    if (score >= 4) return "A2";
    return "A1";
  };

  const getVocabularyLevel = (score) => {
    if (score >= 8) return "Advanced";
    if (score >= 6) return "Intermediate";
    if (score >= 4) return "Elementary";
    return "Basic";
  };

  const getNextLevel = (score) => {
    const currentBand = getCEFRBand(score);
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const currentIndex = levels.indexOf(currentBand);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : "C2";
  };

  const generateSuggestions = (score) => {
    if (score >= 8) return ["Excellent work! Focus on advanced vocabulary and complex structures"];
    if (score >= 6) return ["Good progress! Work on fluency and pronunciation accuracy"];
    if (score >= 4) return ["Keep practicing! Focus on clear pronunciation and basic grammar"];
    return ["Start with simple sentences and clear pronunciation"];
  };

  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header with Level */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-800">🎤 Advanced Speaking Practice</h1>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${CEFR_LEVELS[userLevel].color}`}>
              Level: {userLevel} - {CEFR_LEVELS[userLevel].name}
            </div>
          </div>
          
          {/* Current Task */}
          {currentTask && (
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">{currentTask[1].title}</h2>
              <p className="text-blue-700 mb-4">{currentTask[1].instruction}</p>
              <div className="flex items-center gap-4 text-sm text-blue-600">
                <span>⏱️ Duration: {currentTask[1].duration}s</span>
                <span>📊 Level: {currentTask[1].level}</span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Analysis Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Speech Input */}
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">🎙️ Speech Input</h3>
            
            {/* Timer */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">{seconds}s</div>
              <div className="text-gray-600">
                {isRecording ? "Recording..." : "Click to start"}
              </div>
            </div>
            
            {/* Recording Button */}
            <div className="flex flex-col items-center mb-6">
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
                      className="w-2 h-8 bg-blue-600 rounded-full"
                    />
                  ))}
                </div>
              )}
              
              <button
                onClick={isRecording ? stopAdvancedRecording : startAdvancedRecording}
                disabled={!isSpeechSupported}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-600 hover:bg-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? "⏹️" : "🎙️"}
              </button>
            </div>
            
            {/* Real-time Transcript */}
            <div className="bg-gray-50 p-4 rounded-xl min-h-[120px]">
              <h4 className="font-semibold text-gray-700 mb-2">Live Transcript:</h4>
              <div className="text-gray-800">
                {realTimeTranscript || "Start speaking to see live transcript..."}
              </div>
            </div>
          </div>
          
          {/* Real-time Analysis */}
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Live Analysis</h3>
            
            {/* Real-time Metrics */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Words per minute:</span>
                <span className="font-bold text-blue-600">{realTimeAnalysis.wordsPerMinute || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Word count:</span>
                <span className="font-bold text-green-600">{realTimeAnalysis.wordCount || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-bold text-purple-600">
                  {realTimeAnalysis.averageConfidence ? 
                    `${Math.round(realTimeAnalysis.averageConfidence * 100)}%` : 
                    "0%"}
                </span>
              </div>
            </div>
            
            {/* Word-level Pronunciation Scores */}
            {pronunciationScores.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Word Pronunciation:</h4>
                <div className="flex flex-wrap gap-2">
                  {pronunciationScores.slice(-10).map((wordScore, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        wordScore.needsImprovement 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {wordScore.word} ({wordScore.pronunciationScore}/10)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Feedback */}
        {feedback && (
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Detailed Analysis</h3>
            
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-2xl mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-blue-800">Overall Score</h4>
                  <p className="text-blue-600">CEFR Band: {feedback.overall.band}</p>
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  {feedback.overall.score}/10
                </div>
              </div>
            </div>
            
            {/* Skill Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">{feedback.pronunciation.score}/10</div>
                <div className="text-green-700 font-medium">Pronunciation</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">{feedback.fluency.score}/10</div>
                <div className="text-blue-700 font-medium">Fluency</div>
                <div className="text-xs text-blue-600">{feedback.fluency.wpm} WPM</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-600">{feedback.grammar.score}/10</div>
                <div className="text-yellow-700 font-medium">Grammar</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-600">{feedback.vocabulary.score}/10</div>
                <div className="text-purple-700 font-medium">Vocabulary</div>
                <div className="text-xs text-purple-600">{feedback.vocabulary.level}</div>
              </div>
            </div>
            
            {/* Detailed Feedback Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pronunciation Details */}
              <div className="bg-green-50 p-6 rounded-xl">
                <h4 className="font-bold text-green-800 mb-3">🗣️ Pronunciation Analysis</h4>
                
                {feedback.pronunciation.issues.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-green-700 mb-2">Words to improve:</h5>
                    <div className="flex flex-wrap gap-2">
                      {feedback.pronunciation.issues.map((word, index) => (
                        <span key={index} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {feedback.pronunciation.strengths.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">Well pronounced:</h5>
                    <div className="flex flex-wrap gap-2">
                      {feedback.pronunciation.strengths.slice(0, 5).map((word, index) => (
                        <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Grammar & Vocabulary */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-3">📝 Grammar & Vocabulary</h4>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-semibold text-blue-700">Grammar Issues:</h5>
                    <ul className="text-blue-600 text-sm list-disc list-inside">
                      {feedback.grammar.mistakes.map((mistake, index) => (
                        <li key={index}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-blue-700">Vocabulary Suggestions:</h5>
                    <ul className="text-blue-600 text-sm list-disc list-inside">
                      {feedback.vocabulary.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="mt-6 bg-yellow-50 p-6 rounded-xl">
              <h4 className="font-bold text-yellow-800 mb-3">🎯 Next Steps</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-yellow-700 mb-2">Recommendations:</h5>
                  <ul className="text-yellow-600 text-sm list-disc list-inside">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-yellow-700 mb-2">Target Level:</h5>
                  <p className="text-yellow-600 text-sm">
                    Work towards <strong>{feedback.nextLevel}</strong> level
                  </p>
                  <button
                    onClick={selectTaskForLevel}
                    className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition"
                  >
                    Try Another Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}