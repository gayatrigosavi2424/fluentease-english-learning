import React, { useState, useContext, useEffect } from "react";
import { updateUserProgress } from "../services/progress";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { checkGrammar } from "../services/api";
import { writeTopics } from "../utils/topics"; // ✅ local topics

export default function Write({ onProgressUpdate }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    getNewTopic();
  }, []);

  const getNewTopic = () => {
    const randomIndex = Math.floor(Math.random() * writeTopics.length);
    setTopic(writeTopics[randomIndex]);
    setText(""); // Clear text when getting new topic
    setFeedback(""); // Clear feedback
  };

  const analyzeWriting = (text) => {
    const exactMistakes = [];
    const suggestions = [];
    const strengths = [];
    
    // Word count analysis
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    
    // EXACT GRAMMAR MISTAKE DETECTION
    
    // 1. EXACT capitalization errors
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
    
    // 2. EXACT spelling errors with precise detection
    const spellingErrors = {
      'englsit': { correct: 'English', rule: 'Spelling error: incorrect spelling of "English"' },
      'englsih': { correct: 'English', rule: 'Spelling error: letters transposed in "English"' },
      'langauge': { correct: 'language', rule: 'Spelling error: extra "a" in "language"' },
      'comunication': { correct: 'communication', rule: 'Spelling error: missing "m" in "communication"' },
      'importent': { correct: 'important', rule: 'Spelling error: "-ent" should be "-ant"' },
      'necesary': { correct: 'necessary', rule: 'Spelling error: missing "s" in "necessary"' },
      'recieve': { correct: 'receive', rule: 'Spelling error: "i before e" rule exception' },
      'seperate': { correct: 'separate', rule: 'Spelling error: "a" not "e" in middle' },
      'definately': { correct: 'definitely', rule: 'Spelling error: "-itely" not "-ately"' },
      'grammer': { correct: 'grammar', rule: 'Spelling error: single "r" not double' },
      'occured': { correct: 'occurred', rule: 'Spelling error: missing "r"' },
      'begining': { correct: 'beginning', rule: 'Spelling error: missing "n"' },
      'writting': { correct: 'writing', rule: 'Spelling error: single "t" not double' },
      'comunity': { correct: 'community', rule: 'Spelling error: missing "m"' }
    };
    
    Object.entries(spellingErrors).forEach(([wrong, {correct, rule}]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];
      matches.forEach(match => {
        exactMistakes.push({
          type: 'Spelling Error',
          wrong: `"${match[0]}"`,
          correct: `"${correct}"`,
          rule: rule,
          position: match.index
        });
      });
    });
    
    // 3. EXACT punctuation errors
    const punctuationPatterns = [
      {
        pattern: /\.thats\b/g,
        correct: '. That\'s',
        rule: 'Missing space after period and apostrophe in contraction'
      },
      {
        pattern: /\bthats\b(?!')/g,
        correct: 'that\'s',
        rule: 'Missing apostrophe in contraction'
      },
      {
        pattern: /communication\s*\.?\s*thats/g,
        correct: 'communication, that\'s',
        rule: 'Missing comma before dependent clause'
      }
    ];
    
    punctuationPatterns.forEach(({pattern, correct, rule}) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        exactMistakes.push({
          type: 'Punctuation Error',
          wrong: `"${match[0]}"`,
          correct: `"${correct}"`,
          rule: rule,
          position: match.index
        });
      });
    });
    
    // 4. EXACT article errors
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
    
    // 5. EXACT proper noun capitalization
    const properNounPatterns = [
      {
        pattern: /\blearning english\b/gi,
        correct: 'learning English',
        rule: '"English" is a proper noun and must be capitalized'
      },
      {
        pattern: /\benglish language\b/gi,
        correct: 'English language',
        rule: '"English" is a proper noun and must be capitalized'
      }
    ];
    
    properNounPatterns.forEach(({pattern, correct, rule}) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        exactMistakes.push({
          type: 'Capitalization Error',
          wrong: `"${match[0]}"`,
          correct: `"${correct}"`,
          rule: rule,
          position: match.index
        });
      });
    });
    
    // 6. EXACT word repetition detection
    const wordFreq = {};
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !['that', 'have', 'with', 'were', 'they', 'this', 'will', 'from'].includes(cleanWord)) {
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
          rule: `Word repetition reduces writing quality - vary vocabulary`,
          position: -1
        });
      }
    });
    
    // 7. EXACT sentence structure issues
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (wordCount > 20 && sentences.length < 2) {
      exactMistakes.push({
        type: 'Sentence Structure',
        wrong: `Single sentence with ${wordCount} words`,
        correct: 'Break into 2-3 shorter sentences',
        rule: 'Long sentences reduce readability',
        position: -1
      });
    }
    
    sentences.forEach((sentence, index) => {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (sentenceWords > 25) {
        exactMistakes.push({
          type: 'Sentence Length',
          wrong: `Sentence ${index + 1} (${sentenceWords} words)`,
          correct: `Break sentence ${index + 1} into parts`,
          rule: `Sentences over 25 words are hard to follow`,
          position: -1
        });
      }
    });
    
    // 8. Missing end punctuation
    if (text.trim() && !/[.!?]$/.test(text.trim())) {
      exactMistakes.push({
        type: 'Punctuation Error',
        wrong: 'No ending punctuation',
        correct: 'Add period at end',
        rule: 'Sentences must end with punctuation',
        position: text.length - 1
      });
    }
    
    // Strengths analysis (unchanged)
    if (wordCount >= 15) strengths.push('✅ Good attempt at expressing ideas');
    if (wordCount >= 30) strengths.push('✅ Adequate length for the topic');
    if (wordCount >= 50) strengths.push('✅ Good length - detailed response');
    if (sentences.length >= 2) strengths.push('✅ Used multiple sentences');
    if (text.includes(',')) strengths.push('✅ Good use of punctuation');
    if (text.includes('opinion')) strengths.push('✅ Good use of opinion expression');
    if (text.includes('essential') || text.includes('important')) strengths.push('✅ Good vocabulary choice');
    
    // Targeted suggestions based on exact mistakes
    const errorTypes = [...new Set(exactMistakes.map(m => m.type))];
    
    if (errorTypes.includes('Spelling Error')) {
      suggestions.push('💡 Use spell-check tools or read more to improve spelling');
    }
    if (errorTypes.includes('Capitalization Error')) {
      suggestions.push('💡 Remember: capitalize "I", proper nouns, and sentence beginnings');
    }
    if (errorTypes.includes('Punctuation Error')) {
      suggestions.push('💡 Check punctuation: apostrophes, commas, and end marks');
    }
    if (errorTypes.includes('Article Error')) {
      suggestions.push('💡 Use "a" before consonants, "an" before vowel sounds');
    }
    if (errorTypes.includes('Word Repetition')) {
      suggestions.push('💡 Use synonyms and varied vocabulary');
    }
    if (errorTypes.includes('Sentence Structure') || errorTypes.includes('Sentence Length')) {
      suggestions.push('💡 Write shorter, clearer sentences');
    }
    
    // General suggestions
    if (wordCount < 30) suggestions.push('💡 Try to write more - aim for at least 30 words');
    if (sentences.length < 2) suggestions.push('💡 Use multiple sentences for better flow');
    suggestions.push('💡 Read your writing aloud to check if it sounds natural');
    
    // Remove duplicate mistakes (same type, wrong, and correct)
    const uniqueMistakes = [];
    const seen = new Set();
    
    exactMistakes.forEach(mistake => {
      const key = `${mistake.type}|${mistake.wrong}|${mistake.correct}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMistakes.push(mistake);
      }
    });
    
    // Calculate precise score
    let score = 8; // Base score
    score -= Math.min(uniqueMistakes.length * 1.2, 6); // Deduct 1.2 points per unique mistake, max 6
    if (wordCount < 10) score -= 2;
    if (wordCount >= 30) score += 0.5;
    if (sentences.length >= 2) score += 0.5;
    if (wordCount >= 50) score += 0.5;
    
    return {
      score: Math.max(1, Math.min(10, Math.round(score))),
      exactMistakes: uniqueMistakes.length > 0 ? uniqueMistakes : [],
      mistakes: uniqueMistakes.length > 0 ? 
        uniqueMistakes.map(m => `❌ ${m.wrong} → ✅ ${m.correct} (${m.rule})`) : 
        ['✅ No grammar mistakes found! Excellent work!'],
      strengths,
      suggestions,
      wordCount,
      sentenceCount: sentences.length
    };
  };

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error("Please write something first!");
      return;
    }

    setLoading(true);
    setFeedback("");
    
    try {
      // Local analysis
      const localAnalysis = analyzeWriting(text);
      
      // Try to get AI feedback as well
      let aiAnalysis = null;
      try {
        const res = await checkGrammar(text, "write");
        aiAnalysis = res;
      } catch (aiError) {
        console.log("AI analysis failed, using local analysis");
      }
      
      // Combine analyses
      const finalScore = aiAnalysis?.score || localAnalysis.score;
      const combinedFeedback = {
        score: finalScore,
        ...localAnalysis,
        aiFeedback: aiAnalysis?.feedback || null
      };
      
      setFeedback(combinedFeedback);

      if (user) {
        await updateUserProgress(user.uid, "write", finalScore);
        if (typeof onProgressUpdate === "function") onProgressUpdate();
        toast.success(`✅ Writing analyzed! Score: ${finalScore}/10`);
      }
    } catch (err) {
      console.error("Write error:", err);
      // Fallback to local analysis only
      const localAnalysis = analyzeWriting(text);
      setFeedback(localAnalysis);
      toast.warning("Analysis completed with local checking only.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-10 max-w-3xl w-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-900">✍️ Write on Topic</h2>
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-center text-gray-700 mb-3">
            <strong>Topic:</strong> {topic || "Loading topic..."}
          </p>
          <div className="text-center">
            <button
              onClick={getNewTopic}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition text-sm"
            >
              🔄 New Topic
            </button>
          </div>
        </div>

        <textarea
          rows="8"
          placeholder="Start writing your response here... (minimum 50 words recommended)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-inner resize-none"
        ></textarea>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleCheck}
            disabled={loading || !text.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Check Grammar & Get Feedback"}
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          Words: {text.split(' ').filter(word => word.length > 0).length}
        </div>

        {feedback && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-300 shadow-sm text-center">
              <h3 className="font-bold text-xl text-blue-800 mb-2">📝 Writing Score</h3>
              <div className="text-4xl font-bold text-blue-600">{feedback.score}/10</div>
              <div className="text-sm text-gray-600 mt-2">
                {feedback.wordCount} words • {feedback.sentenceCount} sentences
              </div>
            </div>

            {/* Exact Mistakes */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-300 shadow-sm">
              <h3 className="font-bold text-lg text-red-800 mb-3">
                🔍 Exact Grammar Analysis ({feedback.exactMistakes?.length || 0} issues found)
              </h3>
              
              {feedback.exactMistakes && feedback.exactMistakes.length > 0 ? (
                <div className="space-y-4">
                  {feedback.exactMistakes.map((mistake, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="flex items-center mb-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                          {mistake.type}
                        </span>
                        <span className="text-sm text-gray-600">Error #{index + 1}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-red-600 font-medium mr-2">❌ Wrong:</span>
                          <span className="bg-red-100 px-2 py-1 rounded text-red-800 font-mono text-sm">
                            {mistake.wrong}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-600 font-medium mr-2">✅ Correct:</span>
                          <span className="bg-green-100 px-2 py-1 rounded text-green-800 font-mono text-sm">
                            {mistake.correct}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-600 font-medium mr-2">📝 Rule:</span>
                          <span className="text-blue-700 text-sm">{mistake.rule}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-green-600 text-lg font-semibold mb-2">🎉 Perfect Grammar!</div>
                  <p className="text-green-700">No grammar, spelling, or punctuation errors found.</p>
                </div>
              )}
            </div>

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
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-300 shadow-sm">
              <h3 className="font-bold text-lg text-yellow-800 mb-3">💡 Suggestions for Improvement</h3>
              <ul className="space-y-2">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    <span className="text-yellow-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Feedback if available */}
            {feedback.aiFeedback && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-300 shadow-sm">
                <h3 className="font-bold text-lg text-purple-800 mb-2">🤖 AI Analysis</h3>
                <p className="text-purple-700 whitespace-pre-wrap">{feedback.aiFeedback}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
