from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# ---------------- Schemas ---------------- #

class GrammarRequest(BaseModel):
    topic: str
    text: str

class GrammarResponse(BaseModel):
    input_text: str
    corrected_text: str
    mistakes: list
    score: int
    overall_feedback: str


# ---------------- API ---------------- #

@router.post("/check", response_model=GrammarResponse)
async def check_grammar(request: GrammarRequest):

    if not request.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    try:
        data = await check_with_gemini(
            topic=request.topic,
            text=request.text
        )

        return GrammarResponse(
            input_text=request.text,
            corrected_text=data["corrected_text"],
            mistakes=data["mistakes"],
            score=data["score"],
            overall_feedback=data["overall_feedback"]
        )

    except Exception as e:
        raise HTTPException(500, str(e))


# ---------------- Gemini ---------------- #

async def check_with_gemini(topic: str, text: str):

    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
You are a STRICT English teacher evaluating a student's spoken response.

Return ONLY valid JSON in this format:

{{
  "mistakes": [
    {{
      "wrong": "",
      "correct": "",
      "reason": ""
    }}
  ],
  "corrected_text": "",
  "score": 1-10,
  "overall_feedback": ""
}}

DETECT ALL POSSIBLE ERRORS:
- Incomplete sentences
- Abrupt endings
- Wrong word order
- Missing subject or verb
- Tense mistakes
- Article mistakes (a, an, the)
- Preposition mistakes
- Singular/plural errors
- Spelling mistakes
- Repeated words
- Awkward phrasing
- Missing punctuation
- Capitalization errors
- Run-on sentences
- Wrong connectors (because, that, which, etc.)

STRICT RULES:
- Quote EXACT wrong phrase from user text
- If sentence is broken → MUST flag it
- Do NOT ignore real mistakes
- Spoken English is allowed, but NOT incorrect English
- NO fake praise
- Score must reflect quality:
    * Very bad → 1-3
    * Average → 4-6
    * Good → 7-8
    * Excellent → 9-10
- If no mistakes, return empty mistakes array
- Do NOT add any text outside JSON

TOPIC: "{topic}"
USER TEXT: "{text}"
"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Parse JSON safely
        data = json.loads(raw)

        return data

    except json.JSONDecodeError:
        raise Exception("Gemini returned invalid JSON format")

    except Exception as e:
        raise Exception(f"Gemini API failed: {e}")
