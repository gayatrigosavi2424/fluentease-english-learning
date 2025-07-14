from fastapi import APIRouter, Request
import language_tool_python

router = APIRouter()

# Initialize the free grammar tool
tool = language_tool_python.LanguageTool('en-US')

@router.post("/grammar")
async def check_grammar(request: Request):
    data = await request.json()
    text = data.get("text", "")

    feedback = ""
    matches = tool.check(text)
    corrected = tool.correct(text)

    # 🧮 Scoring logic
    total_issues = len(matches)
    score = max(0, 10 - total_issues)

    feedback += f"✅ Corrected: {corrected}\n"
    feedback += f"\n🛠️ Issues found: {total_issues}"

    for i, match in enumerate(matches[:3], 1):  # limit to 3
        if "Possible spelling mistake" in match.message and "gayatri" in text.lower():
            continue
        feedback += f"\n\n{i}. {match.message} (Suggestion: {match.replacements})"

    return {
        "feedback": feedback.strip(),
        "score": score
    }
