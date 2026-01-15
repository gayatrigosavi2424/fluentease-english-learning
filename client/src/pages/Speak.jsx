import React, { useContext, useEffect, useRef, useState } from "react";
import { checkGrammar } from "../services/api";
import { motion } from "framer-motion";
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { speakTopics } from "../utils/topics";

export default function Speak({ onProgressUpdate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [topic, setTopic] = useState("");
  const [seconds, setSeconds] = useState(20);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Get new topic on load
  useEffect(() => {
    getNewTopic();
    initializeSpeechRecognition();
  }, []);

  const getNewTopic = () => {
    const randomIndex = Math.floor(Math.random() * speakTopics.length);
    setTopic(speakTopics[randomIndex]);
    setTranscript("");
    setFeedback(null);
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      // Handle results
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
      
      // Handle start
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };
      
      // Handle end
      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
        
        // Auto-restart if still recording
        if (isRecording && seconds > 0) {
          try {
            console.log('Auto-restarting speech recognition...');
            recognitionRef.current.start();
          } catch (error) {
            console.log('Could not restart:', error);
          }
        }
      };
      
      // Handle errors with better recovery
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          toast.error('🎤 Microphone access denied. Please allow microphone access in your browser settings.');
          setIsRecording(false);
          clearInterval(timerRef.current);
        } else if (event.error === 'no-speech') {
          // Don't show error for no-speech, just continue listening
          console.log('No speech detected, continuing...');
        } else if (event.error === 'network') {
          // Network error - try to continue
          console.log('Network error, will retry...');
          toast.warning('Network issue detected. Continuing to listen...');
        } else if (event.error === 'aborted') {
          console.log('Recognition aborted');
        } else {
          toast.warning(`Speech recognition issue: ${event.error}. Continuing...`);
        }
      };
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('🎤 Speech recognition not supported. Please use Chrome or Edge browser.');
      return;
    }

    setIsRecording(true);
    setTranscript("");
    setFeedback(null);
    
    // Start speech recognition
    try {
      recognitionRef.current.start();
      setTranscript("🎤 Listening... Start speaking!");
      toast.info('🎤 Microphone activated! Start speaking now.');
    } catch (error) {
      console.error('Error starting recognition:', error);
      
      // If already started, stop and restart
      if (error.message && error.message.includes('already started')) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setTranscript("🎤 Listening... Start speaking!");
          }, 100);
        } catch (retryError) {
          toast.error('Failed to start speech recognition. Please refresh the page.');
          setIsRecording(false);
          return;
        }
      } else {
        toast.error('Failed to start speech recognition. Please check microphone permissions.');
        setIsRecording(false);
        return;
      }
    }

    // Start timer
    let timeLeft = 20;
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
    
    // Capture current transcript before stopping recognition
    const currentTranscript = transcript;
    console.log("Stopping recording, current transcript:", currentTranscript);
    
    // Stop speech recognition
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Process transcript with captured value
    setTimeout(() => {
      processTranscriptWithText(currentTranscript);
    }, 500);
    
    // Backup analysis in case the first one fails
    setTimeout(() => {
      if (!feedback && currentTranscript && currentTranscript.trim().length > 3) {
        console.log("Backup analysis triggered");
        processTranscriptWithText(currentTranscript);
      }
    }, 2000);
  };

  const processTranscriptWithText = async (textToAnalyze) => {
    const currentTranscript = textToAnalyze || transcript;
    console.log("Processing transcript:", currentTranscript);
    
    if (!currentTranscript || 
        currentTranscript === "🎤 Listening... Start speaking!" ||
        currentTranscript.includes("No speech detected") ||
        currentTranscript.includes("Speech recognition error") ||
        currentTranscript.length < 3) {
      
      console.log("Invalid transcript detected, showing no speech message");
      setFeedback({
        feedback: "No clear speech detected. Please try again and speak more clearly.",
        score: 0,
        detailed_scores: {},
        exactMistakes: [],
        mistakes: ["No speech detected"],
        strengths: [],
        suggestions: ["Check microphone permissions", "Speak louder and clearer", "Try again"],
        aiFeedback: null
      });
      return;
    }
    
    console.log("Valid transcript found, proceeding with analysis...");
    
    try {
      console.log("Sending transcript for Gemini analysis:", currentTranscript);
      
      // Local analysis for exact mistakes
      const localAnalysis = analyzeSpeechMistakes(currentTranscript);
      
      // Get enhanced AI feedback from Gemini API
      let aiResult = null;
      try {
        aiResult = await checkGrammar(currentTranscript, "speak");
        console.log("Gemini analysis result:", aiResult);
      } catch (aiError) {
        console.log("Gemini analysis failed, using local analysis only");
      }
      
      // Calculate comprehensive scores
      const baseScore = aiResult?.score || calculateScoreFromMistakes(localAnalysis.exactMistakes);
      const pronunciationScore = calculatePronunciationScore(currentTranscript, localAnalysis.exactMistakes);
      const grammarScore = Math.max(1, baseScore - localAnalysis.exactMistakes.filter(m => m.type.includes('Grammar')).length);
      const fluencyScore = calculateFluencyScore(currentTranscript, localAnalysis.exactMistakes);
      const vocabularyScore = calculateVocabularyScore(currentTranscript);
      
      setFeedback({
        feedback: "", // We'll show structured feedback instead
        score: Math.round((baseScore + pronunciationScore + grammarScore + fluencyScore + vocabularyScore) / 5),
        detailed_scores: {
          pronunciation: pronunciationScore,
          grammar: grammarScore,
          fluency: fluencyScore,
          vocabulary: vocabularyScore
        },
        exactMistakes: localAnalysis.exactMistakes,
        mistakes: localAnalysis.exactMistakes.length > 0 ? 
          localAnalysis.exactMistakes.map(m => `❌ ${m.wrong} → ✅ ${m.correct} (${m.rule})`) : 
          ["✅ No major grammar mistakes found!"],
        strengths: localAnalysis.strengths,
        suggestions: localAnalysis.suggestions,
        aiFeedback: aiResult?.feedback || null,
        speechAnalysis: {
          wordCount: currentTranscript.split(' ').length,
          sentenceCount: currentTranscript.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
          avgWordsPerSentence: Math.round(currentTranscript.split(' ').length / Math.max(1, currentTranscript.split(/[.!?]+/).filter(s => s.trim().length > 0).length)),
          speakingTime: "20 seconds",
          wordsPerMinute: Math.round((currentTranscript.split(' ').length / 20) * 60)
        }
      });

      // Save progress
      if (user) {
        const finalScore = Math.round((baseScore + pronunciationScore + grammarScore + fluencyScore + vocabularyScore) / 5);
        await updateUserProgress(user.uid, "speak", finalScore);
        if (typeof onProgressUpdate === "function") onProgressUpdate();
        toast.success(`🎉 Speaking analyzed! Score: ${finalScore}/10`);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Fallback to local analysis only
      const localAnalysis = analyzeSpeechMistakes(currentTranscript);
      const score = calculateScoreFromMistakes(localAnalysis.exactMistakes);
      
      setFeedback({
        feedback: "",
        score: score,
        detailed_scores: { 
          pronunciation: Math.max(1, score), 
          grammar: Math.max(1, score - localAnalysis.exactMistakes.length), 
          fluency: Math.max(1, score), 
          vocabulary: Math.max(1, score) 
        },
        exactMistakes: localAnalysis.exactMistakes,
        mistakes: localAnalysis.exactMistakes.length > 0 ? 
          localAnalysis.exactMistakes.map(m => `❌ ${m.wrong} → ✅ ${m.correct}`) : 
          ["No major grammar mistakes detected"],
        strengths: localAnalysis.strengths,
        suggestions: localAnalysis.suggestions,
        aiFeedback: null
      });
    }
  };

  const processTranscript = async () => {
    const currentTranscript = transcript.trim();
    
    console.log("Current transcript for analysis:", currentTranscript);
    console.log("Transcript length:", currentTranscript.length);
    
    // Check if we have valid speech - FIXED LOGIC
    if (!currentTranscript || 
        currentTranscript === "🎤 Listening... Start speaking!" ||
        currentTranscript.includes("No speech detected") ||
        currentTranscript.includes("Speech recognition error") ||
        currentTranscript.length < 3) {
      
      console.log("Invalid transcript detected, showing no speech message");
      setFeedback({
        feedback: "No clear speech detected. Please try again and speak more clearly.",
        score: 0,
        detailed_scores: {},
        mistakes: ["No speech detected"],
        strengths: [],
        suggestions: ["Check microphone permissions", "Speak louder and clearer", "Try again"]
      });
      return;
    }
    
    console.log("Valid transcript found, proceeding with analysis...");

    try {
      console.log("Sending transcript for analysis:", currentTranscript);
      
      // Analyze the speech using grammar check
      const result = await checkGrammar(currentTranscript, "speak");
      
      console.log("Grammar check result:", result);
      
      // Analyze the transcript for specific grammar mistakes
      const grammarMistakes = analyzeGrammarMistakes(currentTranscript);
      
      // Create detailed feedback with real analysis
      const score = Math.max(1, Math.min(10, result.score || calculateScoreFromMistakes(grammarMistakes)));
      
      setFeedback({
        feedback: "", // Remove generic feedback
        score: score,
        detailed_scores: {
          pronunciation: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1)),
          grammar: Math.max(1, Math.min(10, score - grammarMistakes.length)),
          fluency: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1)),
          vocabulary: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 2) - 1))
        },
        mistakes: grammarMistakes.length > 0 ? grammarMistakes : ["No major grammar mistakes found!"],
        strengths: analyzeStrengths(currentTranscript),
        suggestions: generateSpecificSuggestions(grammarMistakes, currentTranscript)
      });

      // Save progress
      if (user) {
        await updateUserProgress(user.uid, "speak", score);
        if (typeof onProgressUpdate === "function") onProgressUpdate();
        toast.success(`🎉 Speaking analyzed! Score: ${score}/10`);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Even if API fails, provide detailed local analysis
      const grammarMistakes = analyzeGrammarMistakes(currentTranscript);
      const score = calculateScoreFromMistakes(grammarMistakes);
      
      setFeedback({
        feedback: "", // No generic feedback
        score: score,
        detailed_scores: { 
          pronunciation: Math.max(1, score), 
          grammar: Math.max(1, score - grammarMistakes.length), 
          fluency: Math.max(1, score), 
          vocabulary: Math.max(1, score) 
        },
        mistakes: grammarMistakes.length > 0 ? grammarMistakes : ["No major grammar mistakes detected"],
        strengths: analyzeStrengths(currentTranscript),
        suggestions: generateSpecificSuggestions(grammarMistakes, currentTranscript)
      });
    }
  };

  // Enhanced speech analysis functions
  const analyzeSpeechMistakes = (text) => {
    const exactMistakes = [];
    const strengths = [];
    const suggestions = [];
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    console.log("Analyzing speech:", text);
    console.log("Word count:", words.length);
    console.log("Sentence count:", sentences.length);
    
    // 1. EXACT grammar errors
    const grammarPatterns = [
      {
        pattern: /\bi are\b/gi,
        correct: 'I am',
        rule: 'Subject-verb agreement: "I" takes "am", not "are"',
        type: 'Grammar Error'
      },
      {
        pattern: /\bhe are\b|\bshe are\b/gi,
        correct: 'he/she is',
        rule: 'Subject-verb agreement: third person singular takes "is"',
        type: 'Grammar Error'
      },
      {
        pattern: /\bwe was\b/gi,
        correct: 'we were',
        rule: 'Subject-verb agreement: plural subjects take "were"',
        type: 'Grammar Error'
      },
      {
        pattern: /\bthey was\b/gi,
        correct: 'they were',
        rule: 'Subject-verb agreement: plural subjects take "were"',
        type: 'Grammar Error'
      }
    ];
    
    grammarPatterns.forEach(({pattern, correct, rule, type}) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        exactMistakes.push({
          type: type,
          wrong: `"${match[0]}"`,
          correct: `"${correct}"`,
          rule: rule,
          position: match.index
        });
      });
    });
    
    // 2. EXACT article errors
    const articleMatches = [...text.matchAll(/\ba\s+([aeiou]\w*)/gi)];
    articleMatches.forEach(match => {
      const vowelWord = match[1];
      exactMistakes.push({
        type: 'Article Error',
        wrong: `"${match[0]}"`,
        correct: `"an ${vowelWord}"`,
        rule: 'Use "an" before words starting with vowel sounds',
        position: match.index
      });
    });
    
    // 3. EXACT speech recognition errors (common patterns)
    const speechErrors = [
      {
        pattern: /\bto gave\b/gi,
        correct: 'that gave',
        rule: 'Verb form error: "to gave" should be "that gave" or "to give"',
        type: 'Speech Recognition Error'
      },
      {
        pattern: /\bwhile is metric\b/gi,
        correct: 'while it was magic',
        rule: 'Speech recognition misheard phrase',
        type: 'Speech Recognition Error'
      },
      {
        pattern: /\ban enjoyed\b/gi,
        correct: 'and enjoyed',
        rule: 'Article confusion: "an enjoyed" should be "and enjoyed"',
        type: 'Speech Recognition Error'
      },
      {
        pattern: /\bor not a lot\b/gi,
        correct: 'quite a lot',
        rule: 'Awkward phrasing: unclear meaning',
        type: 'Fluency Error'
      }
    ];
    
    speechErrors.forEach(({pattern, correct, rule, type}) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        exactMistakes.push({
          type: type,
          wrong: `"${match[0]}"`,
          correct: `"${correct}"`,
          rule: rule,
          position: match.index
        });
      });
    });
    
    // 4. EXACT capitalization errors
    const iMatches = [...text.matchAll(/\bi\s/g)];
    iMatches.forEach(match => {
      exactMistakes.push({
        type: 'Capitalization Error',
        wrong: `"${match[0].trim()}"`,
        correct: '"I"',
        rule: 'Personal pronoun "I" must always be capitalized',
        position: match.index
      });
    });
    
    // 5. EXACT word repetition
    const wordFreq = {};
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !['that', 'have', 'with', 'were', 'they', 'this', 'will', 'from', 'very', 'much'].includes(cleanWord)) {
        if (!wordFreq[cleanWord]) wordFreq[cleanWord] = [];
        wordFreq[cleanWord].push({word: word, index: index});
      }
    });
    
    Object.entries(wordFreq).forEach(([cleanWord, occurrences]) => {
      if (occurrences.length > 2) {
        exactMistakes.push({
          type: 'Word Repetition',
          wrong: `"${cleanWord}" (used ${occurrences.length} times)`,
          correct: `Use synonyms for "${cleanWord}"`,
          rule: `Repetitive vocabulary reduces speaking quality`,
          position: -1
        });
      }
    });
    
    // 6. EXACT fluency issues
    if (words.length < 10) {
      exactMistakes.push({
        type: 'Fluency Error',
        wrong: `Very short response (${words.length} words)`,
        correct: 'Speak for longer to show fluency',
        rule: 'Short responses don\'t demonstrate speaking ability',
        position: -1
      });
    }
    
    if (words.length > 15 && sentences.length < 2) {
      exactMistakes.push({
        type: 'Sentence Structure',
        wrong: `Single long sentence (${words.length} words)`,
        correct: 'Break into multiple sentences',
        rule: 'Long sentences reduce clarity in speech',
        position: -1
      });
    }
    
    // 7. Incomplete thoughts
    if (text.trim().match(/\b(and|or|but|so)$/i)) {
      exactMistakes.push({
        type: 'Incomplete Speech',
        wrong: 'Sentence ends with conjunction',
        correct: 'Complete your thought',
        rule: 'Finish sentences completely when speaking',
        position: text.length - 5
      });
    }
    
    // STRENGTHS ANALYSIS
    if (words.length >= 20) strengths.push('✅ Good speaking length - adequate response');
    if (words.length >= 40) strengths.push('✅ Excellent length - detailed response');
    if (sentences.length >= 2) strengths.push('✅ Used multiple sentences - good structure');
    if (text.includes('I love') || text.includes('I enjoy') || text.includes('I like')) {
      strengths.push('✅ Good use of personal expressions');
    }
    if (text.includes('because') || text.includes('so') || text.includes('therefore')) {
      strengths.push('✅ Used connecting words - shows reasoning');
    }
    if (text.match(/\b(very|really|quite|extremely)\b/i)) {
      strengths.push('✅ Used intensifiers - good vocabulary range');
    }
    if (text.match(/\b(always|sometimes|often|usually|never)\b/i)) {
      strengths.push('✅ Used frequency adverbs - shows time awareness');
    }
    
    // TARGETED SUGGESTIONS
    const errorTypes = [...new Set(exactMistakes.map(m => m.type))];
    
    if (errorTypes.includes('Grammar Error')) {
      suggestions.push('💡 Practice subject-verb agreement (I am, he is, they are)');
    }
    if (errorTypes.includes('Article Error')) {
      suggestions.push('💡 Remember: "a" before consonants, "an" before vowels');
    }
    if (errorTypes.includes('Speech Recognition Error')) {
      suggestions.push('💡 Speak more clearly - some words were misheard');
    }
    if (errorTypes.includes('Word Repetition')) {
      suggestions.push('💡 Use varied vocabulary - practice synonyms');
    }
    if (errorTypes.includes('Fluency Error')) {
      suggestions.push('💡 Practice speaking for longer periods');
    }
    if (errorTypes.includes('Sentence Structure')) {
      suggestions.push('💡 Use shorter, clearer sentences when speaking');
    }
    
    // General speaking suggestions
    if (words.length < 30) suggestions.push('💡 Try to speak more - aim for 30+ words');
    suggestions.push('💡 Practice speaking slowly and clearly');
    suggestions.push('💡 Think before speaking to organize your thoughts');
    
    return {
      exactMistakes,
      strengths: strengths.length > 0 ? strengths : ['✅ Completed the speaking exercise'],
      suggestions
    };
  };
  
  const calculateScoreFromMistakes = (mistakes) => {
    console.log("Calculating score from", mistakes.length, "mistakes");
    
    let score = 8; // Start with good base score
    
    // Deduct points for mistakes
    if (mistakes.length === 0) {
      score = 9; // Very good, but not perfect
    } else if (mistakes.length === 1) {
      score = 8; // Good with minor issues
    } else if (mistakes.length === 2) {
      score = 7; // Average
    } else if (mistakes.length === 3) {
      score = 6; // Below average
    } else if (mistakes.length >= 4) {
      score = Math.max(3, 8 - mistakes.length); // Poor but not failing
    }
    
    console.log("Calculated score:", score);
    return score;
  };

  const calculatePronunciationScore = (text, mistakes) => {
    let score = 8; // Base pronunciation score
    
    // Deduct for speech recognition errors (indicates unclear pronunciation)
    const speechErrors = mistakes.filter(m => m.type === 'Speech Recognition Error');
    score -= speechErrors.length * 1.5;
    
    // Bonus for clear speech (longer text usually means clearer pronunciation)
    const wordCount = text.split(' ').length;
    if (wordCount >= 30) score += 0.5;
    if (wordCount >= 50) score += 0.5;
    
    return Math.max(1, Math.min(10, Math.round(score)));
  };

  const calculateFluencyScore = (text, mistakes) => {
    let score = 7; // Base fluency score
    
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Length bonus (fluency shown through sustained speech)
    if (wordCount >= 20) score += 1;
    if (wordCount >= 40) score += 1;
    if (wordCount >= 60) score += 0.5;
    
    // Sentence variety bonus
    if (sentences.length >= 2) score += 0.5;
    if (sentences.length >= 3) score += 0.5;
    
    // Deduct for fluency issues
    const fluencyErrors = mistakes.filter(m => 
      m.type === 'Fluency Error' || 
      m.type === 'Incomplete Speech' || 
      m.type === 'Word Repetition'
    );
    score -= fluencyErrors.length * 1;
    
    // Deduct for very short responses
    if (wordCount < 10) score -= 3;
    if (wordCount < 20) score -= 1;
    
    return Math.max(1, Math.min(10, Math.round(score)));
  };

  const calculateVocabularyScore = (text) => {
    let score = 7; // Base vocabulary score
    
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words.filter(w => w.length > 3));
    const vocabularyRichness = uniqueWords.size / Math.max(words.length, 1);
    
    // Vocabulary diversity bonus
    if (vocabularyRichness > 0.7) score += 2;
    else if (vocabularyRichness > 0.5) score += 1;
    else if (vocabularyRichness < 0.3) score -= 1;
    
    // Advanced vocabulary bonus
    const advancedWords = ['essential', 'important', 'significant', 'experience', 'opportunity', 'definitely', 'absolutely', 'particularly', 'especially'];
    const hasAdvanced = advancedWords.some(word => text.toLowerCase().includes(word));
    if (hasAdvanced) score += 1;
    
    // Connecting words bonus
    const connectors = ['because', 'however', 'therefore', 'although', 'furthermore', 'moreover'];
    const hasConnectors = connectors.some(word => text.toLowerCase().includes(word));
    if (hasConnectors) score += 0.5;
    
    return Math.max(1, Math.min(10, Math.round(score)));
  };
  
  const analyzeStrengths = (text) => {
    const strengths = [];
    const words = text.split(' ');
    
    if (words.length > 20) {
      strengths.push("✅ Good length - you spoke for a substantial amount");
    }
    if (text.includes('I love') || text.includes('I enjoy')) {
      strengths.push("✅ Good use of personal expressions");
    }
    if (text.includes('so much') || text.includes('thank you')) {
      strengths.push("✅ Used emotional expressions and politeness");
    }
    if (text.includes('peace') || text.includes('hobby')) {
      strengths.push("✅ Good vocabulary related to the topic");
    }
    
    return strengths.length > 0 ? strengths : ["✅ Completed the speaking exercise"];
  };
  
  const generateSpecificSuggestions = (mistakes, text) => {
    const suggestions = [];
    
    if (mistakes.length > 3) {
      suggestions.push("💡 Focus on sentence structure - plan your sentences before speaking");
    }
    if (text.includes('singing') && mistakes.some(m => m.includes('repeated'))) {
      suggestions.push("💡 Use synonyms: 'singing' → 'music', 'vocal performance', 'melodies'");
    }
    if (mistakes.some(m => m.includes('article'))) {
      suggestions.push("💡 Practice articles: use 'a' before consonants, 'an' before vowels");
    }
    if (mistakes.some(m => m.includes('word order'))) {
      suggestions.push("💡 Practice sentence structure: Subject + Verb + Object");
    }
    
    suggestions.push("💡 Read your sentences aloud to check if they sound natural");
    suggestions.push("💡 Practice speaking slowly to organize your thoughts better");
    
    return suggestions;
  };

  // Check browser support
  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-100 to-blue-100 px-4">
      <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-10 max-w-3xl w-full space-y-6">
        
        {/* Browser Support Warning */}
        {!isSpeechSupported && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <p className="text-red-800 text-sm">
              ❌ Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
            </p>
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-800">
          🎤 Speak on Topic
        </h2>

        {/* Topic Section */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-center text-gray-700 mb-3 text-lg">
            <strong>Topic:</strong> {topic || "Loading..."}
          </p>
          <div className="text-center">
            <button
              onClick={getNewTopic}
              disabled={isRecording}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition text-sm disabled:opacity-50"
            >
              🔄 New Topic
            </button>
          </div>
        </div>

        {/* Timer */}
        <p className="text-center font-medium text-gray-800">
          ⏱️ Timer: {isRecording ? `${seconds}s` : "Click the mic to start (20 seconds)"}
        </p>

        {/* Transcript Display */}
        <div className="bg-white p-5 rounded-xl shadow-inner text-gray-700 min-h-[100px]">
          <h3 className="font-semibold text-lg">📝 What You Said</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border min-h-[60px] flex items-center">
            {isRecording ? (
              <div className="flex items-center text-blue-600">
                <div className="animate-pulse mr-2">🎤</div>
                <span className="italic">
                  {transcript === "🎤 Listening... Start speaking!" ? 
                    "Listening... Start speaking!" : 
                    transcript || "Listening..."}
                </span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap italic">
                {transcript && transcript !== "🎤 Listening... Start speaking!" ? 
                  `"${transcript}"` : 
                  "Click the mic and start speaking..."}
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
                  className="w-2 h-8 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Main Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isSpeechSupported}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? "⏹️" : "🎙️"}
          </button>

          {/* Manual Analyze Button */}
          {!isRecording && transcript && transcript !== "🎤 Listening... Start speaking!" && (
            <button
              onClick={() => {
                console.log("Manual analysis triggered with transcript:", transcript);
                processTranscriptWithText(transcript);
              }}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition text-sm"
            >
              📊 Analyze My Speech
            </button>
          )}
          
          {/* Force Analysis Button - for debugging */}
          {!isRecording && transcript && (
            <button
              onClick={() => {
                const forceTranscript = transcript.trim();
                console.log("Force analyzing:", forceTranscript);
                processTranscriptWithText(forceTranscript);
              }}
              className="mt-2 bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition"
            >
              🔧 Force Analysis (Debug)
            </button>
          )}
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-300 shadow-sm text-center">
              <h3 className="font-bold text-xl text-blue-800 mb-2">🎯 Your Score</h3>
              <div className="text-4xl font-bold text-blue-600">{feedback.score || 0}/10</div>
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

            {/* Exact Grammar Mistakes - SIMPLIFIED */}
            {feedback.exactMistakes && feedback.exactMistakes.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-300 shadow-sm">
                <h3 className="font-bold text-lg text-red-800 mb-3">
                  ❌ Grammar Mistakes Found: {feedback.exactMistakes.length}
                </h3>
                
                <div className="space-y-3">
                  {feedback.exactMistakes.map((mistake, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <span className="text-red-600 font-medium mr-2 min-w-fit">❌ Wrong:</span>
                          <span className="bg-red-100 px-2 py-1 rounded text-red-800 text-sm">
                            {mistake.wrong}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-green-600 font-medium mr-2 min-w-fit">✅ Correct:</span>
                          <span className="bg-green-100 px-2 py-1 rounded text-green-800 text-sm">
                            {mistake.correct}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-600 font-medium mr-2 min-w-fit">📝 Why:</span>
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
                <h3 className="text-xl font-bold text-green-800 mb-2">Excellent Speaking!</h3>
                <p className="text-green-700">No grammar or fluency errors detected. Keep up the great work!</p>
              </div>
            )}
            
            {/* Poor Response Message - Show if score is low */}
            {feedback.score < 5 && (!feedback.exactMistakes || feedback.exactMistakes.length === 0) && !feedback.aiFeedback && (
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-300 shadow-sm text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-xl font-bold text-orange-800 mb-2">Incomplete Response</h3>
                <p className="text-orange-700">Your response seems too short or incomplete. Try speaking more about the topic!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}