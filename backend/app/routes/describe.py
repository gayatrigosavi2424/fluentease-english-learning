from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import random
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Request schema
class DescribeRequest(BaseModel):
    text: str

# Response schema
class DescribeResponse(BaseModel):
    feedback: str
    score: int

class ImageResponse(BaseModel):
    image_url: str
    description: str
    prompt: str

# Predefined image prompts for description practice
IMAGE_PROMPTS = [
    {
        "url": "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A beautiful sunset over a calm lake with mountains in the background",
        "prompt": "Describe this peaceful landscape scene"
    },
    {
        "url": "https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400", 
        "description": "A busy city street with people walking and cars",
        "prompt": "Describe the activity and atmosphere of this urban scene"
    },
    {
        "url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A cozy coffee shop interior with people reading and working",
        "prompt": "Describe what you see in this coffee shop scene"
    },
    {
        "url": "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A family having a picnic in a park on a sunny day",
        "prompt": "Describe this family outdoor activity"
    },
    {
        "url": "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A modern kitchen with fresh ingredients on the counter",
        "prompt": "Describe this kitchen scene and what cooking activities might happen here"
    },
    {
        "url": "https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "Children playing in a playground with swings and slides",
        "prompt": "Describe the playground activities and atmosphere"
    },
    {
        "url": "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A student studying in a library surrounded by books",
        "prompt": "Describe this study environment and the student's activities"
    },
    {
        "url": "https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A dog playing fetch in a park with its owner",
        "prompt": "Describe this pet and owner interaction"
    }
]

def calculate_description_score(text: str, feedback: str) -> int:
    """Calculate description score based on text quality and AI feedback"""
    if not text.strip():
        return 0
    
    # Basic metrics
    words = text.split()
    word_count = len(words)
    sentence_count = len([s for s in text.split('.') if s.strip()])
    
    # Base score calculation
    base_score = 5  # Start with middle score
    
    # Adjust for length and detail
    if 15 <= word_count <= 100:
        base_score += 2
    elif word_count > 100:
        base_score += 3
    elif word_count < 10:
        base_score -= 2
    
    # Adjust for sentence structure
    if sentence_count >= 2:
        base_score += 1
    
    # Adjust based on feedback keywords
    feedback_lower = feedback.lower()
    
    if any(word in feedback_lower for word in ["excellent", "detailed", "vivid", "comprehensive"]):
        base_score += 3
    elif any(word in feedback_lower for word in ["good", "well", "nice", "clear"]):
        base_score += 2
    elif any(word in feedback_lower for word in ["basic", "simple", "adequate"]):
        base_score += 1
    elif any(word in feedback_lower for word in ["poor", "vague", "unclear", "incomplete"]):
        base_score -= 2
    
    return max(1, min(10, base_score))

@router.get("/image", response_model=ImageResponse)
async def get_random_image():
    """Get a random image for description practice"""
    try:
        image_data = random.choice(IMAGE_PROMPTS)
        return ImageResponse(
            image_url=image_data["url"],
            description=image_data["description"],
            prompt=image_data["prompt"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image: {str(e)}")

@router.post("/feedback", response_model=DescribeResponse)
async def describe_feedback(request: DescribeRequest):
    """Analyze description text and provide feedback"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Description cannot be empty")
        
        # Try to use Gemini API
        try:
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""
            Analyze this image description for:
            1. Descriptive language and vocabulary
            2. Detail and completeness
            3. Grammar and sentence structure
            4. Use of adjectives and sensory details
            5. Overall clarity and engagement
            
            Description to analyze:
            "{request.text}"
            
            Provide constructive feedback focusing on:
            - What was described well
            - Areas for improvement
            - Suggestions for more vivid or detailed descriptions
            - Grammar or vocabulary suggestions
            
            Be encouraging and specific in your feedback.
            """
            
            response = model.generate_content(prompt)
            feedback = response.text
            
        except Exception as gemini_error:
            # Fallback feedback if Gemini fails
            word_count = len(request.text.split())
            sentence_count = len([s for s in request.text.split('.') if s.strip()])
            
            feedback = f"""Great job on your description! Here's some feedback:

✅ What you did well:
- You wrote {word_count} words, showing good effort
- Your description shows attention to detail

💡 Areas for improvement:
- Try to use more descriptive adjectives (colors, sizes, emotions)
- Consider describing what people might be feeling or thinking
- Add sensory details (what might you hear, smell, or feel?)

🎯 Suggestions:
- Use varied sentence structures to make your writing more engaging
- Practice describing not just what you see, but the mood or atmosphere
- Keep practicing - descriptive writing improves with experience!

Keep up the excellent work! 🌟"""
        
        # Calculate score
        score = calculate_description_score(request.text, feedback)
        
        return DescribeResponse(
            feedback=feedback,
            score=score
        )
        
    except Exception as e:
        # Final fallback
        return DescribeResponse(
            feedback="Thank you for your description! Keep practicing your descriptive writing skills. Focus on using vivid adjectives and detailed observations.",
            score=6
        )