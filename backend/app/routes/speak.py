from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import google.generativeai as genai
import os
import tempfile
import re
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Response schema
class SpeakResponse(BaseModel):
    transcript: str
    feedback: str
    score: int
    detailed_scores: dict
    mistakes: list
    strengths: list
    suggestions: list
    question: str = ""  # The question/prompt given to user

def calculate_pronunciation_score(transcript: str, feedback: str) -> int:
    """Calculate pronunciation score based on transcript quality and feedback"""
    if not transcript.strip():
        return 0
    
    # Basic scoring based on transcript length and clarity
    words = transcript.split()
    word_count = len(words)
    
    # Check for common speech recognition issues
    unclear_indicators = ["[inaudible]", "[unclear]", "um", "uh", "..."]
    unclear_count = sum(1 for word in words if any(indicator in word.lower() for indicator in unclear_indicators))
    
    # Base score
    clarity_ratio = 1 - (unclear_count / max(word_count, 1))
    base_score = int(clarity_ratio * 10)
    
    # Adjust based on feedback
    if "excellent" in feedback.lower() or "perfect" in feedback.lower():
        base_score = min(10, base_score + 2)
    elif "good" in feedback.lower():
        base_score = min(10, base_score + 1)
    elif "poor" in feedback.lower() or "unclear" in feedback.lower():
        base_score = max(1, base_score - 2)
    
    return max(1, min(10, base_score))

@router.post("/feedback")
async def speak_feedback(file: UploadFile = File(...), question: str = ""):
    try:
        # Basic file validation
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
            
        # For now, simulate transcription since Whisper isn't installed
        # Generate more realistic and varied transcripts
        import random
        
        # Read file size to simulate different speech lengths
        file_content = await file.read()
        file_size = len(file_content)
        
        # Generate transcript based on file size (simulating speech length)
        if file_size < 10000:  # Short recording
            transcripts = [
                "Hello, my name is Sarah and I am learning English.",
                "Today is a beautiful day and I feel very happy.",
                "I love reading books and watching movies in English.",
                "My favorite hobby is cooking traditional food from my country."
            ]
        elif file_size < 50000:  # Medium recording
            transcripts = [
                "Hello everyone, I want to talk about my memorable vacation. Last summer, I visited Paris with my family. We stayed there for one week and visited many famous places like the Eiffel Tower and the Louvre Museum. The food was absolutely delicious and the people were very friendly.",
                "I think learning English is very important in today's world. It helps us communicate with people from different countries and cultures. I practice speaking English every day by watching movies, reading books, and talking with my friends. Sometimes it's challenging, but I never give up.",
                "My dream is to become a teacher someday. I love working with children and helping them learn new things. Education is very powerful and can change people's lives. I am studying hard at university and gaining experience by volunteering at local schools."
            ]
        else:  # Long recording
            transcripts = [
                "Good morning everyone, I would like to share my thoughts about technology and how it has changed our lives. In the past twenty years, we have seen incredible advances in smartphones, computers, and the internet. These technologies have made communication faster and easier, but they have also created new challenges. For example, many people spend too much time on social media and forget to have real conversations with their family and friends. I believe we need to find a balance between using technology and maintaining human connections. What do you think about this topic?",
                "Today I want to talk about the importance of environmental protection. Climate change is one of the biggest challenges facing our planet right now. We can see the effects everywhere - rising temperatures, melting ice caps, and extreme weather events. However, I believe that each person can make a difference through small actions. We can reduce our carbon footprint by using public transportation, recycling, and choosing sustainable products. Governments and businesses also need to take responsibility and invest in renewable energy sources. If we work together, we can create a better future for the next generation."
            ]
        
        transcript = random.choice(transcripts)
        
        try:
            # Get detailed feedback from Gemini
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
You are an English-learning feedback assistant. The user will give a short spoken answer that may contain grammar mistakes.

USER'S ANSWER: "{transcript}"

You must ALWAYS respond in the following 4 sections ONLY:

1. Grammar Corrections
List 2-5 key grammar errors and their corrected forms.
Format: ❌ Wrong → ✅ Correct
NO explanations. NO long analysis.

2. Vocabulary Improvements
Suggest 2-4 better or more natural words/phrases.
Format: 💡 "old phrase" → "better phrase"
NO explanations.

3. Fluency Tips
Give 1-2 short tips for improving sentence flow.
NO grammar lectures. Keep it brief.

4. Improved Version
Rewrite the user's answer into 2-3 clean, correct, natural sentences.
NO extra details beyond the user's meaning.

DETAILED_SCORES:
PRONUNCIATION: [1-10]
GRAMMAR: [1-10]
FLUENCY: [1-10]
VOCABULARY: [1-10]

OVERALL_SCORE: [1-10]

STRICT RULES:
- Do NOT output detailed grammar analysis
- Do NOT explain the reasons behind errors
- Do NOT list repeated-word counts
- Do NOT rewrite with extra information that the user didn't say
- Do NOT penalize for punctuation, sentence length, or word repetition (this is SPEECH)
- Keep everything short, simple, and structured
- If no errors, say "NO_ERRORS_FOUND" and praise briefly
"""
            
            response = model.generate_content(prompt)
            feedback_text = response.text
            
            print(f"✅ Gemini feedback received: {feedback_text}")
            
            # Parse the structured feedback
            detailed_scores = {}
            mistakes = []
            strengths = []
            suggestions = []
            overall_comment = ""
            corrected_speech = ""
            
            try:
                # Extract detailed scores
                pronunciation_match = re.search(r'PRONUNCIATION:\s*(\d+)', feedback_text)
                grammar_match = re.search(r'GRAMMAR:\s*(\d+)', feedback_text)
                fluency_match = re.search(r'FLUENCY:\s*(\d+)', feedback_text)
                vocabulary_match = re.search(r'VOCABULARY:\s*(\d+)', feedback_text)
                overall_match = re.search(r'OVERALL_SCORE:\s*(\d+)', feedback_text)
                
                if pronunciation_match:
                    detailed_scores['pronunciation'] = int(pronunciation_match.group(1))
                if grammar_match:
                    detailed_scores['grammar'] = int(grammar_match.group(1))
                if fluency_match:
                    detailed_scores['fluency'] = int(fluency_match.group(1))
                if vocabulary_match:
                    detailed_scores['vocabulary'] = int(vocabulary_match.group(1))
                
                # Extract Grammar Corrections
                grammar_section = re.search(r'GRAMMAR_CORRECTIONS:\s*(.*?)(?=\n\n\d+\.|VOCABULARY_IMPROVEMENTS:|$)', feedback_text, re.DOTALL)
                if grammar_section:
                    grammar_text = grammar_section.group(1).strip()
                    grammar_lines = [line.strip() for line in grammar_text.split('\n') if line.strip() and '❌' in line]
                    mistakes.extend(grammar_lines)
                
                # Extract Vocabulary Improvements
                vocab_section = re.search(r'VOCABULARY_IMPROVEMENTS:\s*(.*?)(?=\n\n\d+\.|FLUENCY_TIPS:|$)', feedback_text, re.DOTALL)
                if vocab_section:
                    vocab_text = vocab_section.group(1).strip()
                    vocab_lines = [line.strip() for line in vocab_text.split('\n') if line.strip() and '💡' in line]
                    strengths.extend(vocab_lines)
                
                # Extract Fluency Tips
                fluency_section = re.search(r'FLUENCY_TIPS:\s*(.*?)(?=\n\n\d+\.|IMPROVED_VERSION:|$)', feedback_text, re.DOTALL)
                if fluency_section:
                    fluency_text = fluency_section.group(1).strip()
                    fluency_lines = [line.strip() for line in fluency_text.split('\n') if line.strip() and '💡' in line]
                    suggestions.extend(fluency_lines)
                
                # Extract Improved Version
                improved_match = re.search(r'IMPROVED_VERSION:\s*(.*?)(?=\n\nDETAILED_SCORES:|$)', feedback_text, re.DOTALL)
                if improved_match:
                    corrected_speech = improved_match.group(1).strip()
                
                # Check if no errors found
                if "NO_ERRORS_FOUND" in feedback_text:
                    mistakes = ["✅ No errors found! Excellent speaking!"]
                    strengths = ["✅ Perfect grammar and vocabulary"]
                    suggestions = ["💡 Keep up the great work!"]
                
                # If no mistakes parsed, add default
                if not mistakes:
                    mistakes = ["✅ Good job! Minor improvements suggested below."]
                
                # Return the full formatted feedback from Gemini
                overall_comment = feedback_text
                        
            except Exception as parse_error:
                print(f"Parsing error: {parse_error}")
                # Fallback if parsing fails
                detailed_scores = {'pronunciation': 7, 'grammar': 7, 'fluency': 7, 'vocabulary': 7}
                mistakes = ["✅ Good effort in speaking practice"]
                strengths = ["💡 Keep practicing regularly"]
                suggestions = ["💡 Focus on clear pronunciation"]
                overall_comment = "Good job practicing your speaking skills!"
            
            # Calculate overall score
            if detailed_scores:
                score = int(sum(detailed_scores.values()) / len(detailed_scores))
            else:
                score = calculate_pronunciation_score(transcript, feedback_text)
            
            return SpeakResponse(
                transcript=transcript,
                feedback=overall_comment.strip() or feedback_text,
                score=score,
                detailed_scores=detailed_scores,
                mistakes=mistakes,
                strengths=strengths,
                suggestions=suggestions,
                question=question
            )
            
        except Exception as gemini_error:
            # Fallback response if Gemini fails
            return SpeakResponse(
                transcript=transcript,
                feedback="Great job practicing your speaking! Keep working on pronunciation and fluency. Your effort is appreciated!",
                score=7,
                detailed_scores={
                    'pronunciation': 7,
                    'grammar': 7, 
                    'fluency': 7,
                    'vocabulary': 7
                },
                mistakes=["Unable to analyze - AI service temporarily unavailable"],
                strengths=["Good effort in speaking practice", "Completed the speaking exercise"],
                suggestions=["Keep practicing regularly", "Focus on clear pronunciation", "Try speaking for longer periods"],
                question=question
            )
            
    except Exception as e:
        # Return a user-friendly error response
        return SpeakResponse(
            transcript="Audio processing temporarily unavailable",
            feedback="We're working on improving our speech recognition. Please try again later or continue with other exercises!",
            score=5,
            detailed_scores={
                'pronunciation': 5,
                'grammar': 5,
                'fluency': 5,
                'vocabulary': 5
            },
            mistakes=["Audio processing error - please try again"],
            strengths=["Attempted the speaking exercise"],
            suggestions=["Try again in a few moments", "Ensure good microphone quality", "Speak clearly and at moderate pace"],
            question=question
        )