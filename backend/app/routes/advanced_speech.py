from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional
import google.generativeai as genai
import os
import tempfile
import json
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Advanced request/response models
class WordScore(BaseModel):
    word: str
    pronunciation_score: float
    confidence: float
    needs_improvement: bool

class FluentcyMetrics(BaseModel):
    words_per_minute: float
    pause_count: int
    average_pause_duration: float
    speech_rate_consistency: float

class PronunciationAnalysis(BaseModel):
    overall_score: float
    word_scores: List[WordScore]
    phoneme_issues: List[str]
    strengths: List[str]
    improvement_tips: List[str]

class GrammarAnalysis(BaseModel):
    score: float
    mistakes: List[Dict[str, str]]  # {"original": "...", "corrected": "...", "explanation": "..."}
    complexity_score: float
    sentence_structure_score: float

class VocabularyAnalysis(BaseModel):
    score: float
    level: str  # CEFR level
    unique_words_ratio: float
    advanced_words: List[str]
    suggestions: List[str]

class CEFRAssessment(BaseModel):
    level: str
    confidence: float
    next_level_requirements: List[str]

class AdvancedSpeechResponse(BaseModel):
    transcript: str
    overall_score: float
    cefr_assessment: CEFRAssessment
    pronunciation: PronunciationAnalysis
    fluency: FluentcyMetrics
    grammar: GrammarAnalysis
    vocabulary: VocabularyAnalysis
    detailed_feedback: str
    improvement_plan: List[str]
    next_task_recommendation: str

class SpeechAnalysisRequest(BaseModel):
    transcript: str
    duration_seconds: float
    word_confidences: List[Dict[str, float]]
    audio_metrics: Optional[Dict] = None

@router.post("/analyze-speech", response_model=AdvancedSpeechResponse)
async def analyze_advanced_speech(request: SpeechAnalysisRequest):
    """
    Advanced speech analysis with CEFR-level assessment
    """
    try:
        transcript = request.transcript.strip()
        if not transcript:
            raise HTTPException(status_code=400, detail="Empty transcript")
        
        # Perform comprehensive analysis
        analysis_result = await perform_comprehensive_analysis(
            transcript, 
            request.duration_seconds,
            request.word_confidences,
            request.audio_metrics
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def perform_comprehensive_analysis(
    transcript: str, 
    duration: float, 
    word_confidences: List[Dict[str, float]],
    audio_metrics: Optional[Dict] = None
) -> AdvancedSpeechResponse:
    """
    Perform comprehensive speech analysis using AI and local algorithms
    """
    
    # 1. Get AI-powered detailed analysis
    ai_analysis = await get_ai_detailed_analysis(transcript)
    
    # 2. Calculate pronunciation scores
    pronunciation_analysis = calculate_pronunciation_analysis(transcript, word_confidences)
    
    # 3. Analyze fluency metrics
    fluency_metrics = calculate_fluency_metrics(transcript, duration, audio_metrics)
    
    # 4. Grammar analysis
    grammar_analysis = analyze_grammar_advanced(transcript, ai_analysis)
    
    # 5. Vocabulary assessment
    vocabulary_analysis = assess_vocabulary_level(transcript)
    
    # 6. CEFR level assessment
    cefr_assessment = assess_cefr_level(
        pronunciation_analysis, fluency_metrics, grammar_analysis, vocabulary_analysis
    )
    
    # 7. Calculate overall score
    overall_score = calculate_overall_score(
        pronunciation_analysis.overall_score,
        fluency_metrics.words_per_minute,
        grammar_analysis.score,
        vocabulary_analysis.score
    )
    
    # 8. Generate improvement plan
    improvement_plan = generate_improvement_plan(
        cefr_assessment, pronunciation_analysis, grammar_analysis, vocabulary_analysis
    )
    
    # 9. Recommend next task
    next_task = recommend_next_task(cefr_assessment.level, overall_score)
    
    return AdvancedSpeechResponse(
        transcript=transcript,
        overall_score=overall_score,
        cefr_assessment=cefr_assessment,
        pronunciation=pronunciation_analysis,
        fluency=fluency_metrics,
        grammar=grammar_analysis,
        vocabulary=vocabulary_analysis,
        detailed_feedback=ai_analysis.get("detailed_feedback", "Good effort!"),
        improvement_plan=improvement_plan,
        next_task_recommendation=next_task
    )

async def get_ai_detailed_analysis(transcript: str) -> Dict:
    """
    Get detailed AI analysis using Gemini
    """
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        As an expert English language assessor, analyze this speech transcript for CEFR-level assessment:
        
        TRANSCRIPT: "{transcript}"
        
        Provide detailed analysis in JSON format:
        {{
            "grammar_mistakes": [
                {{"original": "mistake", "corrected": "correction", "explanation": "why it's wrong"}}
            ],
            "pronunciation_issues": ["word1", "word2"],
            "vocabulary_level": "A1/A2/B1/B2/C1/C2",
            "complexity_score": 1-10,
            "fluency_assessment": "assessment text",
            "detailed_feedback": "comprehensive feedback",
            "cefr_indicators": ["specific indicators for level assessment"]
        }}
        
        Be specific and constructive in your analysis.
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "grammar_mistakes": [],
                "pronunciation_issues": [],
                "vocabulary_level": "B1",
                "complexity_score": 6,
                "fluency_assessment": "Moderate fluency observed",
                "detailed_feedback": response.text,
                "cefr_indicators": ["Basic communication achieved"]
            }
            
    except Exception as e:
        print(f"AI analysis error: {e}")
        return {
            "grammar_mistakes": [],
            "pronunciation_issues": [],
            "vocabulary_level": "B1",
            "complexity_score": 6,
            "fluency_assessment": "Analysis unavailable",
            "detailed_feedback": "Keep practicing your speaking skills!",
            "cefr_indicators": ["Assessment pending"]
        }

def calculate_pronunciation_analysis(transcript: str, word_confidences: List[Dict[str, float]]) -> PronunciationAnalysis:
    """
    Calculate detailed pronunciation analysis
    """
    words = transcript.split()
    
    # Create word scores from confidence data
    word_scores = []
    for i, word in enumerate(words):
        confidence = 0.8  # Default confidence
        if i < len(word_confidences):
            confidence = word_confidences[i].get(word, 0.8)
        
        pronunciation_score = confidence * 10
        needs_improvement = confidence < 0.7
        
        word_scores.append(WordScore(
            word=word,
            pronunciation_score=pronunciation_score,
            confidence=confidence,
            needs_improvement=needs_improvement
        ))
    
    # Calculate overall pronunciation score
    overall_score = sum(ws.pronunciation_score for ws in word_scores) / len(word_scores) if word_scores else 5.0
    
    # Identify issues and strengths
    issues = [ws.word for ws in word_scores if ws.needs_improvement]
    strengths = [ws.word for ws in word_scores if not ws.needs_improvement]
    
    # Generate improvement tips
    improvement_tips = []
    if len(issues) > len(strengths):
        improvement_tips.append("Focus on clear articulation of consonants")
        improvement_tips.append("Practice word stress patterns")
    if overall_score < 6:
        improvement_tips.append("Slow down your speech for better clarity")
    
    return PronunciationAnalysis(
        overall_score=overall_score,
        word_scores=word_scores,
        phoneme_issues=issues[:5],  # Top 5 issues
        strengths=strengths[:5],    # Top 5 strengths
        improvement_tips=improvement_tips
    )

def calculate_fluency_metrics(transcript: str, duration: float, audio_metrics: Optional[Dict]) -> FluentcyMetrics:
    """
    Calculate fluency metrics
    """
    words = transcript.split()
    word_count = len(words)
    
    # Calculate words per minute
    wpm = (word_count / duration) * 60 if duration > 0 else 0
    
    # Estimate pause count from punctuation and sentence structure
    pause_count = transcript.count(',') + transcript.count('.') + transcript.count('...') + transcript.count(';')
    
    # Estimate average pause duration
    avg_pause_duration = (duration - (word_count * 0.5)) / max(pause_count, 1)  # Rough estimate
    
    # Speech rate consistency (simplified)
    consistency = min(10, max(1, 10 - abs(wpm - 150) / 15))  # 150 WPM is ideal
    
    return FluentcyMetrics(
        words_per_minute=wpm,
        pause_count=pause_count,
        average_pause_duration=max(0, avg_pause_duration),
        speech_rate_consistency=consistency
    )

def analyze_grammar_advanced(transcript: str, ai_analysis: Dict) -> GrammarAnalysis:
    """
    Advanced grammar analysis
    """
    words = transcript.split()
    sentences = [s.strip() for s in transcript.split('.') if s.strip()]
    
    # Get mistakes from AI analysis
    ai_mistakes = ai_analysis.get("grammar_mistakes", [])
    
    # Local grammar checks
    local_mistakes = []
    
    # Check for common issues
    if ' i ' in transcript.lower():
        local_mistakes.append({
            "original": "i (lowercase)",
            "corrected": "I (uppercase)",
            "explanation": "Personal pronoun 'I' should always be capitalized"
        })
    
    # Combine AI and local mistakes
    all_mistakes = ai_mistakes + local_mistakes
    
    # Calculate scores
    mistake_penalty = len(all_mistakes) * 0.5
    base_score = 10 - mistake_penalty
    grammar_score = max(1, min(10, base_score))
    
    # Complexity score based on sentence structure
    avg_sentence_length = len(words) / max(len(sentences), 1)
    complexity_score = min(10, avg_sentence_length / 2)  # Longer sentences = more complex
    
    # Sentence structure score
    structure_score = ai_analysis.get("complexity_score", 6)
    
    return GrammarAnalysis(
        score=grammar_score,
        mistakes=all_mistakes,
        complexity_score=complexity_score,
        sentence_structure_score=structure_score
    )

def assess_vocabulary_level(transcript: str) -> VocabularyAnalysis:
    """
    Assess vocabulary level and complexity
    """
    words = transcript.lower().split()
    unique_words = set(words)
    
    # Calculate unique words ratio
    unique_ratio = len(unique_words) / len(words) if words else 0
    
    # Simple vocabulary level assessment
    if unique_ratio > 0.8 and len(unique_words) > 50:
        level = "C1"
        score = 9
    elif unique_ratio > 0.7 and len(unique_words) > 30:
        level = "B2"
        score = 8
    elif unique_ratio > 0.6 and len(unique_words) > 20:
        level = "B1"
        score = 7
    elif unique_ratio > 0.5:
        level = "A2"
        score = 6
    else:
        level = "A1"
        score = 5
    
    # Identify advanced words (simplified)
    advanced_words = [word for word in unique_words if len(word) > 7][:5]
    
    # Generate suggestions
    suggestions = [
        "Use more varied vocabulary",
        "Try incorporating advanced adjectives",
        "Practice using complex sentence connectors"
    ]
    
    return VocabularyAnalysis(
        score=score,
        level=level,
        unique_words_ratio=unique_ratio,
        advanced_words=advanced_words,
        suggestions=suggestions
    )

def assess_cefr_level(
    pronunciation: PronunciationAnalysis,
    fluency: FluentcyMetrics,
    grammar: GrammarAnalysis,
    vocabulary: VocabularyAnalysis
) -> CEFRAssessment:
    """
    Assess overall CEFR level
    """
    # Weight different aspects
    weighted_score = (
        pronunciation.overall_score * 0.25 +
        min(10, fluency.words_per_minute / 15) * 0.25 +  # Normalize WPM to 0-10 scale
        grammar.score * 0.3 +
        vocabulary.score * 0.2
    )
    
    # Map to CEFR levels
    if weighted_score >= 9:
        level = "C2"
        confidence = 0.9
    elif weighted_score >= 8:
        level = "C1"
        confidence = 0.85
    elif weighted_score >= 7:
        level = "B2"
        confidence = 0.8
    elif weighted_score >= 6:
        level = "B1"
        confidence = 0.75
    elif weighted_score >= 4:
        level = "A2"
        confidence = 0.7
    else:
        level = "A1"
        confidence = 0.65
    
    # Generate next level requirements
    next_requirements = [
        f"Improve pronunciation clarity (current: {pronunciation.overall_score:.1f}/10)",
        f"Increase speaking fluency (current: {fluency.words_per_minute:.0f} WPM)",
        f"Enhance grammar accuracy (current: {grammar.score:.1f}/10)",
        f"Expand vocabulary range (current: {vocabulary.level})"
    ]
    
    return CEFRAssessment(
        level=level,
        confidence=confidence,
        next_level_requirements=next_requirements
    )

def calculate_overall_score(pronunciation: float, wpm: float, grammar: float, vocabulary: float) -> float:
    """
    Calculate weighted overall score
    """
    # Normalize WPM to 0-10 scale (150 WPM = 10)
    fluency_score = min(10, wpm / 15)
    
    # Weighted average
    overall = (pronunciation * 0.25 + fluency_score * 0.25 + grammar * 0.3 + vocabulary * 0.2)
    
    return round(overall, 1)

def generate_improvement_plan(
    cefr: CEFRAssessment,
    pronunciation: PronunciationAnalysis,
    grammar: GrammarAnalysis,
    vocabulary: VocabularyAnalysis
) -> List[str]:
    """
    Generate personalized improvement plan
    """
    plan = []
    
    # Pronunciation improvements
    if pronunciation.overall_score < 7:
        plan.append("Practice pronunciation with phonetic exercises")
        plan.append("Record yourself and compare with native speakers")
    
    # Grammar improvements
    if grammar.score < 7:
        plan.append("Focus on basic grammar structures")
        plan.append("Practice sentence formation exercises")
    
    # Vocabulary improvements
    if vocabulary.score < 7:
        plan.append("Learn 10 new words daily")
        plan.append("Practice using synonyms and advanced vocabulary")
    
    # Level-specific recommendations
    if cefr.level in ["A1", "A2"]:
        plan.append("Focus on basic communication skills")
        plan.append("Practice everyday conversation topics")
    elif cefr.level in ["B1", "B2"]:
        plan.append("Work on expressing complex ideas")
        plan.append("Practice formal and informal speech styles")
    else:
        plan.append("Refine advanced language features")
        plan.append("Practice academic and professional communication")
    
    return plan[:5]  # Return top 5 recommendations

def recommend_next_task(cefr_level: str, overall_score: float) -> str:
    """
    Recommend next practice task based on level and performance
    """
    if cefr_level in ["A1", "A2"]:
        if overall_score < 5:
            return "basic_description"
        else:
            return "simple_introduction"
    elif cefr_level in ["B1", "B2"]:
        if overall_score < 7:
            return "daily_routine"
        else:
            return "opinion_expression"
    else:
        return "presentation"

# Health check endpoint
@router.get("/health")
async def health_check():
    return {"status": "Advanced speech analysis service is running"}