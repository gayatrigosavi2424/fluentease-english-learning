"""
Test script to verify Gemini API is working with the new prompt
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

test_text = "My favorite hobby singing I love singing give me happy"

prompt = f"""
You are an English-learning feedback assistant. The user will give a short spoken answer that may contain grammar mistakes.

USER'S ANSWER: "{test_text}"

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

STRICT RULES:
- Do NOT output detailed grammar analysis
- Do NOT explain the reasons behind errors
- Do NOT list repeated-word counts
- Do NOT rewrite with extra information that the user didn't say
- Do NOT penalize for punctuation, sentence length, or word repetition (this is SPEECH)
- Keep everything short, simple, and structured
- If no errors, say "NO_ERRORS_FOUND" and praise briefly
"""

print("🤖 Testing Gemini API with new strict prompt...\n")
print(f"Input text: {test_text}\n")
print("=" * 60)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    result = response.text
    
    print("✅ Gemini Response:\n")
    print(result)
    print("\n" + "=" * 60)
    print("✅ Test successful! Gemini is working with the new format.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
