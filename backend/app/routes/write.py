from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Request schema
class WriteRequest(BaseModel):
    text: str

# Response schema
class WriteResponse(BaseModel):
    feedback: str
    score: int

def calculate_writing_score(text: str, feedback: str) -> int:
    """Calculate writing score based on text quality and AI feedback"""
    if not text.strip():
        return 0
    
    # Basic metrics
    words = text.split()
    word_count = len(words)
    sentence_count = len([s for s in text.split('.') if s.strip()])
    
    # Base score calculation
    base_score = 5  # Start with middle score
    
    # Adjust for length (reasonable length gets bonus)
    if 20 <= word_count <= 200:
        base_score += 1
    elif word_count > 200:
        base_score += 2
    
    # Adjust based on feedback keywords
    feedback_lower = feedback.lower()
    
    if any(word in feedback_lower for word in ["excellent", "perfect", "outstanding"]):
        base_score += 3
    elif any(word in feedback_lower for word in ["good", "well", "nice"]):
        base_score += 2
    elif any(word in feedback_lower for word in ["average", "okay"]):
        base_score += 1
    elif any(word in feedback_lower for word in ["poor", "weak", "needs improvement"]):
        base_score -= 2
    
    # Check for error indicators
    error_words = ["error", "mistake", "incorrect", "wrong", "fix"]
    error_count = sum(1 for word in error_words if word in feedback_lower)
    base_score -= min(3, error_count)
    
    return max(1, min(10, base_score))

@router.post("/feedback", response_model=WriteResponse)
async def write_feedback(request: WriteRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Analyze this written text for:
        1. Grammar and spelling
        2. Vocabulary usage
        3. Sentence structure
        4. Coherence and flow
        5. Overall writing quality
        
        Text to analyze:
        "{request.text}"
        
        Provide constructive feedback with specific suggestions for improvement.
        Be encouraging while pointing out areas that need work.
        """
        
        response = model.generate_content(prompt)
        feedback = response.text
        
        # Calculate score
        score = calculate_writing_score(request.text, feedback)
        
        return WriteResponse(
            feedback=feedback,
            score=score
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Writing analysis failed: {str(e)}")
