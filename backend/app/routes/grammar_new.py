from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import requests
import os
from dotenv import load_dotenv
import re
import json

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

async def check_with_languagetool(text: str):
    """Check grammar using LanguageTool API (Free and Accurate)"""
    try:
        # LanguageTool public API endpoint
        url = "https://api.languagetool.org/v2/check"
        
        data = {
            'text': text,
            'language': 'en-US',
            'enabledOnly': 'false'
        }
        
        response = requests.post(url, data=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ LanguageTool found {len(result.get('matches', []))} issues")
            return result
        else:
            print(f"❌ LanguageTool API error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ LanguageTool API exception: {e}")
        return None

def process_languagetool_response(text: str, lt_result: dict):
    """Process LanguageTool response and create corrections"""
    if not lt_result or 'matches' not in lt_result:
        return text, [], 9
    
    matches = lt_result['matches']
    corrected_text = text
    mistakes = []
    
    print(f"Processing {len(matches)} grammar issues...")
    
    # Sort matches by offset in reverse order to avoid position shifts when correcting
    matches.sort(key=lambda x: x['offset'], reverse=True)
    
    for match in matches:
        offset = match['offset']
        length = match['length']
        message = match['message']
        category = match.get('rule', {}).get('category', {}).get('name', 'Grammar')
        
        # Get the error text
        error_text = text[offset:offset + length]
        
        # Get suggested replacement
        replacements = match.get('replacements', [])
        if replacements and len(replacements) > 0:
            suggestion = replacements[0]['value']
            
            # Apply correction to the text
            corrected_text = corrected_text[:offset] + suggestion + corrected_text[offset + length:]
            
            # Add to mistakes list with clear formatting
            mistakes.append(f"❌ '{error_text}' → ✅ '{suggestion}' ({message})")
        else:
            # No suggestion available, just note the issue
            mistakes.append(f"⚠️ '{error_text}': {message}")
    
    # Calculate score based on number and severity of errors
    error_count = len(matches)
    word_count = len(text.split())
    
    if error_count == 0:
        score = 10  # Perfect
    elif error_count == 1:
        score = 8   # Very good
    elif error_count == 2:
        score = 7   # Good
    elif error_count == 3:
        score = 6   # Average
    elif error_count <= 5:
        score = 5   # Below average
    else:
        # Many errors = lower score
        error_ratio = error_count / max(word_count, 1)
        score = max(2, int(10 - (error_ratio * 20)))
    
    # Bonus for longer, well-written text
    if word_count >= 20 and error_count <= 2:
        score = min(10, score + 1)
    
    return corrected_text, mistakes, score

async def get_gemini_explanation(original_text: str, mistakes: list, corrected_text: str):
    """Get educational explanation from Gemini"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        if mistakes:
            prompt = f"""
            A student wrote: "{original_text}"
            
            Grammar issues found: {mistakes}
            
            Corrected version: "{corrected_text}"
            
            Please provide:
            1. Brief explanation of why these are errors
            2. Tips to avoid these mistakes
            3. Encouragement for the student
            
            Keep it concise and educational (max 100 words).
            """
        else:
            prompt = f"""
            A student wrote: "{original_text}"
            
            No grammar errors were found! Please provide:
            1. Praise for good grammar
            2. Tips for further improvement
            3. Encouragement to keep writing
            
            Keep it positive and brief (max 50 words).
            """
        
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"Gemini explanation error: {e}")
        if mistakes:
            return "Keep practicing! Focus on proofreading your work before submitting."
        else:
            return "Excellent grammar! Keep up the good work!"

@router.post("/check", response_model=GrammarResponse)
async def check_grammar(request: GrammarRequest):
    """
    Advanced grammar checking using LanguageTool API + Gemini explanations
    """
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        print(f"🔍 Checking grammar for: '{text}'")
        
        # Step 1: Use LanguageTool for accurate grammar detection
        lt_result = await check_with_languagetool(text)
        
        if lt_result is not None:
            # Process LanguageTool results
            corrected_text, mistakes, score = process_languagetool_response(text, lt_result)
            
            # Step 2: Get educational explanation from Gemini
            gemini_explanation = await get_gemini_explanation(text, mistakes, corrected_text)
            
            # Format final feedback
            if mistakes:
                feedback = "📝 Grammar Issues Found:\n\n"
                feedback += "\n".join(mistakes)
                feedback += f"\n\n💡 Learning Tips:\n{gemini_explanation}"
                
                if corrected_text != text:
                    feedback += f"\n\n✅ Corrected Version:\n\"{corrected_text}\""
            else:
                feedback = f"🎉 Perfect Grammar! No errors found.\n\n{gemini_explanation}"
            
            print(f"✅ Analysis complete. Score: {score}/10, Issues: {len(mistakes)}")
            
            return GrammarResponse(
                input_text=text,
                corrected_text=corrected_text,
                feedback=feedback,
                score=score
            )
        
        else:
            print("⚠️ LanguageTool unavailable, using Gemini as primary")
            
            # Fallback: Use Gemini for everything
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""
            Check this text for grammar, spelling, and punctuation errors:
            
            "{text}"
            
            Respond in this exact format:
            CORRECTED: [corrected version here]
            ERRORS: [list each error as: "wrong" → "correct" (reason)]
            SCORE: [number from 1-10]
            TIPS: [brief learning tips]
            """
            
            response = model.generate_content(prompt)
            result = response.text
            
            # Parse Gemini response
            corrected_match = re.search(r'CORRECTED:\s*(.*?)(?=ERRORS:|$)', result, re.DOTALL)
            errors_match = re.search(r'ERRORS:\s*(.*?)(?=SCORE:|TIPS:|$)', result, re.DOTALL)
            score_match = re.search(r'SCORE:\s*(\d+)', result)
            tips_match = re.search(r'TIPS:\s*(.*)', result, re.DOTALL)
            
            corrected_text = corrected_match.group(1).strip() if corrected_match else text
            errors_text = errors_match.group(1).strip() if errors_match else "No errors found"
            score = int(score_match.group(1)) if score_match else 7
            tips = tips_match.group(1).strip() if tips_match else "Keep practicing!"
            
            # Format feedback
            if "no errors" in errors_text.lower() or corrected_text == text:
                feedback = f"🎉 Great job! No major errors found.\n\n💡 {tips}"
            else:
                feedback = f"📝 Issues Found:\n{errors_text}\n\n💡 Tips:\n{tips}"
                if corrected_text != text:
                    feedback += f"\n\n✅ Corrected:\n\"{corrected_text}\""
            
            return GrammarResponse(
                input_text=text,
                corrected_text=corrected_text,
                feedback=feedback,
                score=max(1, min(10, score))
            )
        
    except Exception as e:
        print(f"❌ Grammar check failed: {e}")
        
        # Final fallback - basic response
        return GrammarResponse(
            input_text=request.text,
            corrected_text=request.text,
            feedback="Grammar check temporarily unavailable. Please try again later.",
            score=6
        )

# Health check
@router.get("/health")
async def health_check():
    return {
        "status": "Grammar service running",
        "services": {
            "languagetool": "Primary grammar checker",
            "gemini": "Educational explanations"
        }
    }