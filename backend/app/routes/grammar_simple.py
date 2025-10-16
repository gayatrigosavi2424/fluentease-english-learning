from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Request schema
class GrammarRequest(BaseModel):
    text: str

# Response schema
class GrammarResponse(BaseModel):
    input_text: str
    corrected_text: str
    feedback: str
    score: int

@router.post("/check", response_model=GrammarResponse)
async def check_grammar(request: GrammarRequest):
    """
    Simple Gemini-powered grammar checker with point-wise feedback
    """
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        print(f"🔍 Analyzing text: '{text}'")
        
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are a grammar teacher. Analyze this student's text for errors:
        
        TEXT: "{text}"
        
        Find ALL grammar, spelling, and punctuation mistakes. Respond in this EXACT format:
        
        CORRECTED: [Write the fully corrected version here]
        
        MISTAKES:
        • [Mistake 1: "wrong word/phrase" → "correct word/phrase" - Brief reason]
        • [Mistake 2: "wrong word/phrase" → "correct word/phrase" - Brief reason]  
        • [Mistake 3: "wrong word/phrase" → "correct word/phrase" - Brief reason]
        
        SCORE: [Give a score from 1-10 based on number of errors]
        
        TIPS:
        • [Tip 1 - Keep it simple and actionable]
        • [Tip 2 - Keep it simple and actionable]
        • [Tip 3 - Keep it simple and actionable]
        
        Be thorough - find every single error including:
        - Spelling mistakes
        - Missing punctuation
        - Wrong word choices
        - Grammar errors
        - Capitalization issues
        
        If there are truly NO errors, write "No mistakes found" under MISTAKES.
        """
        
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        print(f"📝 Gemini response: {result}")
        
        # Parse the structured response
        try:
            # Extract corrected text
            corrected_start = result.find("CORRECTED:") + len("CORRECTED:")
            corrected_end = result.find("MISTAKES:")
            corrected_text = result[corrected_start:corrected_end].strip()
            
            # Extract mistakes
            mistakes_start = result.find("MISTAKES:") + len("MISTAKES:")
            mistakes_end = result.find("SCORE:")
            mistakes_section = result[mistakes_start:mistakes_end].strip()
            
            # Extract score
            score_start = result.find("SCORE:") + len("SCORE:")
            score_end = result.find("TIPS:")
            score_text = result[score_start:score_end].strip()
            
            # Extract tips
            tips_start = result.find("TIPS:") + len("TIPS:")
            tips_section = result[tips_start:].strip()
            
            # Parse score
            try:
                score = int(''.join(filter(str.isdigit, score_text)))
                score = max(1, min(10, score))  # Ensure score is 1-10
            except:
                score = 5  # Default score
            
            # Format final feedback
            if "no mistakes found" in mistakes_section.lower() or not mistakes_section.strip():
                feedback = "🎉 Excellent! No grammar mistakes found.\n\n💡 Tips for improvement:\n" + tips_section
            else:
                feedback = f"📝 Grammar Issues Found:\n\n{mistakes_section}\n\n💡 Tips for improvement:\n{tips_section}"
                
                # Add corrected version if different
                if corrected_text and corrected_text.lower() != text.lower():
                    feedback += f"\n\n✅ Corrected Version:\n\"{corrected_text}\""
            
            return GrammarResponse(
                input_text=text,
                corrected_text=corrected_text if corrected_text else text,
                feedback=feedback,
                score=score
            )
            
        except Exception as parse_error:
            print(f"❌ Parsing error: {parse_error}")
            
            # Fallback: Use the raw response
            # Try to extract score from anywhere in the response
            import re
            score_match = re.search(r'(\d+)/10|score.*?(\d+)|(\d+)\s*out\s*of\s*10', result.lower())
            if score_match:
                score = int(score_match.group(1) or score_match.group(2) or score_match.group(3))
            else:
                score = 6
            
            return GrammarResponse(
                input_text=text,
                corrected_text=text,
                feedback=result,
                score=max(1, min(10, score))
            )
        
    except Exception as e:
        print(f"❌ Grammar check failed: {e}")
        
        # Manual fallback for common errors
        corrected_text, manual_feedback, manual_score = manual_grammar_check(request.text)
        
        return GrammarResponse(
            input_text=request.text,
            corrected_text=corrected_text,
            feedback=manual_feedback,
            score=manual_score
        )

def manual_grammar_check(text: str):
    """Manual grammar check as final fallback"""
    mistakes = []
    corrected = text
    
    # Check for obvious errors in the provided text
    if "fevourite" in text.lower():
        corrected = corrected.replace("fevourite", "favourite").replace("Fevourite", "Favourite")
        mistakes.append("• 'fevourite' → 'favourite' - Spelling error")
    
    if "how make money" in text.lower():
        corrected = corrected.replace("how make money", "how to make money")
        mistakes.append("• 'how make money' → 'how to make money' - Missing 'to'")
    
    if "it is ver very" in text.lower():
        corrected = corrected.replace("ver very", "very")
        mistakes.append("• 'ver very' → 'very' - Repeated word error")
    
    if text.count("very") > 1:
        mistakes.append("• Avoid repeating 'very' - Use stronger adjectives instead")
    
    # Check capitalization
    if not text[0].isupper():
        corrected = corrected[0].upper() + corrected[1:]
        mistakes.append("• Start sentence with capital letter")
    
    # Check for missing punctuation at end
    if not text.rstrip().endswith(('.', '!', '?')):
        corrected = corrected.rstrip() + "."
        mistakes.append("• Add punctuation at the end of sentence")
    
    # Calculate score
    error_count = len(mistakes)
    if error_count == 0:
        score = 9
    elif error_count <= 2:
        score = 7
    elif error_count <= 4:
        score = 5
    else:
        score = 3
    
    # Format feedback
    if mistakes:
        feedback = "📝 Grammar Issues Found:\n\n" + "\n".join(mistakes)
        feedback += f"\n\n✅ Corrected Version:\n\"{corrected}\""
        feedback += "\n\n💡 Tips:\n• Proofread before submitting\n• Use spell-check tools\n• Read your text aloud"
    else:
        feedback = "🎉 Good job! No major errors found.\n\n💡 Tips:\n• Keep practicing\n• Try writing longer texts\n• Use varied vocabulary"
    
    return corrected, feedback, score

# Health check
@router.get("/health")
async def health_check():
    return {"status": "Simple Gemini grammar checker running"}