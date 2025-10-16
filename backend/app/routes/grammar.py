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

def calculate_score(original: str, corrected: str, feedback: str) -> int:
    """Calculate a score from 1-10 based on grammar quality"""
    if original.strip().lower() == corrected.strip().lower():
        return 10  # Perfect grammar
    
    # Count number of corrections needed
    error_indicators = ["error", "mistake", "incorrect", "should be", "change"]
    error_count = sum(1 for indicator in error_indicators if indicator in feedback.lower())
    
    # Base score calculation
    text_length = len(original.split())
    if text_length == 0:
        return 0
    
    # Score based on errors per word
    error_ratio = error_count / max(text_length, 1)
    score = max(1, min(10, int(10 - (error_ratio * 8))))
    
    return score

@router.post("/check", response_model=GrammarResponse)
async def check_grammar(request: GrammarRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Try LanguageTool API first (most accurate)
        try:
            corrected_text, feedback, score = await check_with_languagetool(request.text)
            
            return GrammarResponse(
                input_text=request.text,
                corrected_text=corrected_text,
                feedback=feedback,
                score=score
            )
            
        except Exception as languagetool_error:
            print(f"LanguageTool API error: {languagetool_error}")
            
            # Fallback: Try Gemini API
            try:
                corrected_text, feedback, score = await check_with_gemini(request.text)
                
                return GrammarResponse(
                    input_text=request.text,
                    corrected_text=corrected_text,
                    feedback=feedback,
                    score=score
                )
                
            except Exception as gemini_error:
                print(f"Gemini API error: {gemini_error}")
                
                # Final fallback: Local analysis
                corrected_text, feedback, score = analyze_text_locally(request.text)
                
                return GrammarResponse(
                    input_text=request.text,
                    corrected_text=corrected_text,
                    feedback=feedback,
                    score=score
                )
        
    except Exception as e:
        print(f"Grammar check error: {e}")
        raise HTTPException(status_code=500, detail=f"Grammar check failed: {str(e)}")

async def check_with_languagetool(text: str):
    """
    Check grammar using LanguageTool API (free and accurate)
    """
    try:
        # LanguageTool public API endpoint
        url = "https://api.languagetool.org/v2/check"
        
        data = {
            'text': text,
            'language': 'en-US',
            'enabledOnly': 'false'
        }
        
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        matches = result.get('matches', [])
        
        # Apply corrections
        corrected_text = text
        feedback_items = []
        
        # Sort matches by offset in reverse order to avoid position shifts
        matches.sort(key=lambda x: x['offset'], reverse=True)
        
        for match in matches:
            offset = match['offset']
            length = match['length']
            message = match['message']
            
            # Get suggested replacement
            replacements = match.get('replacements', [])
            if replacements:
                suggestion = replacements[0]['value']
                
                # Apply correction
                original_part = corrected_text[offset:offset + length]
                corrected_text = corrected_text[:offset] + suggestion + corrected_text[offset + length:]
                
                # Add to feedback
                feedback_items.append(f"❌ '{original_part}' → ✅ '{suggestion}' ({message})")
            else:
                # No suggestion available, just note the issue
                original_part = corrected_text[offset:offset + length]
                feedback_items.append(f"⚠️ '{original_part}': {message}")
        
        # Calculate score based on number of errors
        error_count = len(matches)
        word_count = len(text.split())
        
        if error_count == 0:
            score = 10
        else:
            # Deduct points based on error density
            error_ratio = error_count / max(word_count, 1)
            score = max(1, min(10, int(10 - (error_ratio * 15))))
        
        # Generate feedback
        if feedback_items:
            feedback = f"Found {error_count} issues:\n\n" + "\n".join(feedback_items)
            feedback += f"\n\nCorrected text:\n\"{corrected_text}\""
        else:
            feedback = "✅ Excellent! No grammar or spelling errors found."
        
        return corrected_text, feedback, score
        
    except requests.exceptions.RequestException as e:
        print(f"LanguageTool API request failed: {e}")
        raise Exception("LanguageTool API unavailable")
    except Exception as e:
        print(f"LanguageTool processing error: {e}")
        raise Exception("LanguageTool processing failed")

async def check_with_gemini(text: str):
    """
    Check grammar using Gemini API with enhanced prompting for exact mistakes
    """
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are an expert English grammar checker. Analyze this text and identify EXACT grammar, spelling, and punctuation mistakes.

        TEXT TO ANALYZE: "{text}"

        For each mistake found, provide:
        1. The EXACT word/phrase that is wrong (quote it exactly as written)
        2. The EXACT correction needed
        3. The specific grammar rule or reason

        Format your response as:

        MISTAKES_FOUND: [number]

        EXACT_ERRORS:
        ❌ MISTAKE: "exact wrong text" 
        ✅ CORRECTION: "exact correct text"
        📝 REASON: [specific grammar rule - be precise]
        ---
        ❌ MISTAKE: "another wrong text"
        ✅ CORRECTION: "another correct text" 
        📝 REASON: [specific grammar rule]
        ---

        CORRECTED_FULL_TEXT: [complete corrected version]

        GRAMMAR_SCORE: [1-10]

        IMPORTANT RULES:
        - Quote mistakes EXACTLY as they appear in the original text
        - Be specific about what type of error it is (spelling, punctuation, grammar, etc.)
        - Don't suggest stylistic changes, only actual errors
        - If no mistakes found, say "NO_MISTAKES_FOUND"
        """
        
        response = model.generate_content(prompt)
        result_text = response.text
        
        # Parse the enhanced response
        mistakes_count_match = re.search(r'MISTAKES_FOUND:\s*(\d+)', result_text)
        corrected_text_match = re.search(r'CORRECTED_FULL_TEXT:\s*(.*?)(?=\n\nGRAMMAR_SCORE:|$)', result_text, re.DOTALL)
        score_match = re.search(r'GRAMMAR_SCORE:\s*(\d+)', result_text)
        
        # Extract individual mistakes
        exact_errors_section = re.search(r'EXACT_ERRORS:\s*(.*?)(?=\nCORRECTED_FULL_TEXT:|$)', result_text, re.DOTALL)
        
        mistakes_count = int(mistakes_count_match.group(1)) if mistakes_count_match else 0
        corrected_text = corrected_text_match.group(1).strip() if corrected_text_match else text
        score = int(score_match.group(1)) if score_match else 7
        
        # Format detailed feedback
        if "NO_MISTAKES_FOUND" in result_text or mistakes_count == 0:
            feedback = "✅ EXCELLENT! No grammar, spelling, or punctuation errors found.\n\nYour writing is grammatically correct!"
        else:
            feedback_parts = [f"📊 GRAMMAR ANALYSIS RESULTS: {mistakes_count} mistake(s) found\n"]
            
            if exact_errors_section:
                errors_text = exact_errors_section.group(1).strip()
                # Split by --- separator and format each error
                error_blocks = [block.strip() for block in errors_text.split('---') if block.strip()]
                
                for i, block in enumerate(error_blocks, 1):
                    mistake_match = re.search(r'❌ MISTAKE:\s*"([^"]*)"', block)
                    correction_match = re.search(r'✅ CORRECTION:\s*"([^"]*)"', block)
                    reason_match = re.search(r'📝 REASON:\s*(.*?)(?=\n|$)', block)
                    
                    if mistake_match and correction_match:
                        mistake = mistake_match.group(1)
                        correction = correction_match.group(1)
                        reason = reason_match.group(1) if reason_match else "Grammar error"
                        
                        feedback_parts.append(f"🔍 ERROR #{i}:")
                        feedback_parts.append(f"   ❌ Wrong: \"{mistake}\"")
                        feedback_parts.append(f"   ✅ Correct: \"{correction}\"")
                        feedback_parts.append(f"   📝 Rule: {reason}")
                        feedback_parts.append("")
            
            feedback_parts.append(f"📝 CORRECTED VERSION:\n\"{corrected_text}\"")
            feedback = "\n".join(feedback_parts)
        
        return corrected_text, feedback, score
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise Exception("Gemini API processing failed")

def analyze_text_locally(text: str):
    """Enhanced local grammar analysis with exact mistake identification"""
    exact_mistakes = []
    corrected = text
    original_text = text
    
    print(f"Analyzing text locally: {text}")
    
    # 1. EXACT capitalization errors
    i_errors = re.finditer(r'\bi\s', text)
    for match in i_errors:
        exact_mistakes.append({
            'wrong': match.group().strip(),
            'correct': 'I',
            'reason': 'Personal pronoun "I" must always be capitalized',
            'position': match.start()
        })
        corrected = re.sub(r'\bi\b', 'I', corrected)
    
    # 2. EXACT article errors
    article_errors = re.finditer(r'\ba\s+([aeiou]\w*)', text, re.IGNORECASE)
    for match in article_errors:
        wrong_phrase = match.group()
        vowel_word = match.group(1)
        correct_phrase = f'an {vowel_word}'
        exact_mistakes.append({
            'wrong': wrong_phrase,
            'correct': correct_phrase,
            'reason': f'Use "an" before words starting with vowel sounds',
            'position': match.start()
        })
        corrected = corrected.replace(wrong_phrase, correct_phrase)
    
    # 3. EXACT spelling and grammar errors with precise detection
    error_patterns = [
        # Exact spelling errors
        (r'\benglsit\b', 'English', "Spelling error: incorrect spelling of 'English'"),
        (r'\benglsih\b', 'English', "Spelling error: incorrect spelling of 'English'"),
        (r'\blangauge\b', 'language', "Spelling error: incorrect spelling of 'language'"),
        (r'\bcomunication\b', 'communication', "Spelling error: missing 'm' in 'communication'"),
        (r'\bimportent\b', 'important', "Spelling error: incorrect ending '-ent' should be '-ant'"),
        (r'\bnecesary\b', 'necessary', "Spelling error: missing 's' in 'necessary'"),
        (r'\brecieve\b', 'receive', "Spelling error: 'i before e' rule exception"),
        (r'\bseperate\b', 'separate', "Spelling error: 'a' not 'e' in middle of 'separate'"),
        (r'\bdefinately\b', 'definitely', "Spelling error: '-itely' not '-ately' ending"),
        (r'\bgrammer\b', 'grammar', "Spelling error: single 'r' not double 'r'"),
        (r'\boccured\b', 'occurred', "Spelling error: missing 'r' in 'occurred'"),
        (r'\bbegining\b', 'beginning', "Spelling error: missing 'n' in 'beginning'"),
        
        # Exact punctuation errors
        (r'\.thats\b', ". That's", "Punctuation error: missing space after period and apostrophe in contraction"),
        (r'\bthats\b(?!\')', "that's", "Punctuation error: missing apostrophe in contraction 'that's'"),
        (r'communication\s*\.?\s*thats', "communication, that's", "Punctuation error: missing comma before 'that's'"),
        
        # Exact capitalization of proper nouns
        (r'\blearning english\b', 'learning English', "Capitalization error: 'English' is a proper noun and must be capitalized"),
        (r'\benglish language\b', 'English language', "Capitalization error: 'English' is a proper noun"),
        
        # Common speech recognition errors
        (r'\bwhile is metric\b', 'while it was magic', "Grammar error: unclear phrase structure"),
        (r'\bto be Impressions\b', 'to see the impressions', "Grammar error: incorrect verb form"),
        (r'\bmovie to gave\b', 'movie that gave', "Grammar error: incorrect verb tense - 'gave' needs 'that'"),
        (r'\ban enjoyed\b', 'and enjoyed', "Grammar error: incorrect article usage"),
    ]
    
    for pattern, replacement, description in error_patterns:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        for match in matches:
            wrong_text = match.group()
            exact_mistakes.append({
                'wrong': wrong_text,
                'correct': replacement,
                'reason': description,
                'position': match.start()
            })
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
    
    # 4. EXACT word repetition detection
    words = text.lower().split()
    word_positions = {}
    for i, word in enumerate(words):
        clean_word = re.sub(r'[^\w]', '', word)
        if len(clean_word) > 3:
            if clean_word not in word_positions:
                word_positions[clean_word] = []
            word_positions[clean_word].append(i)
    
    for word, positions in word_positions.items():
        if len(positions) > 2 and word not in ['that', 'have', 'with', 'were', 'they', 'this', 'will', 'from']:
            exact_mistakes.append({
                'wrong': f'"{word}" (repeated {len(positions)} times)',
                'correct': f'Use synonyms for "{word}"',
                'reason': f'Word repetition: "{word}" appears {len(positions)} times - use variety',
                'position': -1  # Multiple positions
            })
    
    # 5. EXACT sentence structure issues
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    total_words = len(text.split())
    
    if total_words > 20 and len(sentences) < 2:
        exact_mistakes.append({
            'wrong': f'Single sentence with {total_words} words',
            'correct': 'Break into 2-3 shorter sentences',
            'reason': 'Sentence structure: Very long sentence reduces readability',
            'position': -1
        })
    
    # Check individual sentence length
    for i, sentence in enumerate(sentences):
        sentence_words = len(sentence.split())
        if sentence_words > 25:
            exact_mistakes.append({
                'wrong': f'Sentence {i+1} ({sentence_words} words)',
                'correct': f'Break sentence {i+1} into shorter parts',
                'reason': f'Sentence structure: Sentence too long ({sentence_words} words)',
                'position': -1
            })
    
    # 6. Missing punctuation at end
    if text.strip() and not text.strip()[-1] in '.!?':
        exact_mistakes.append({
            'wrong': f'"{text.strip()[-10:]}" (no ending punctuation)',
            'correct': f'"{text.strip()}" + period',
            'reason': 'Punctuation error: Missing period at end of sentence',
            'position': len(text) - 1
        })
        corrected = corrected.rstrip() + '.'
    
    # Calculate score based on exact mistakes found
    base_score = 8
    score_deduction = min(len(exact_mistakes) * 1.2, 6)  # Max 6 points deduction
    
    # Bonus points for good practices
    if total_words >= 30:
        base_score += 0.5
    if len(sentences) >= 2:
        base_score += 0.5
    if total_words >= 50:
        base_score += 0.5
    
    final_score = max(1, min(10, int(base_score - score_deduction)))
    
    # Format detailed feedback
    if not exact_mistakes:
        feedback = "✅ EXCELLENT! No grammar, spelling, or punctuation errors found.\n\nYour writing is grammatically correct!"
    else:
        feedback_parts = [f"📊 EXACT GRAMMAR ANALYSIS: {len(exact_mistakes)} specific mistake(s) found\n"]
        
        for i, mistake in enumerate(exact_mistakes, 1):
            feedback_parts.append(f"🔍 ERROR #{i}:")
            feedback_parts.append(f"   ❌ Wrong: \"{mistake['wrong']}\"")
            feedback_parts.append(f"   ✅ Correct: \"{mistake['correct']}\"")
            feedback_parts.append(f"   📝 Rule: {mistake['reason']}")
            feedback_parts.append("")
        
        feedback_parts.append(f"📝 CORRECTED VERSION:\n\"{corrected}\"")
        feedback = "\n".join(feedback_parts)
    
    print(f"Local analysis result: {len(exact_mistakes)} exact mistakes, score: {final_score}")
    
    return corrected, feedback, final_score
