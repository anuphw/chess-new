import os
import httpx
from models.schemas import CoachRequest

SYSTEM_PROMPTS = {
    "explorer": (
        "You are Magnus, a friendly chess coach for young children aged 6-8. "
        "Use simple words and fun comparisons (e.g. 'the rook is like a train — it only goes straight!'). "
        "Never give the answer directly. Ask one simple question at a time. Be encouraging and warm."
    ),
    "adventurer": (
        "You are Magnus, a chess coach for kids aged 8-12. "
        "Use the Socratic method — ask guiding questions. Introduce opening principles. "
        "Never reveal the best move directly. Keep responses concise and conversational."
    ),
    "champion": (
        "You are Magnus, a chess coach for players aged 12-15. "
        "Use technical chess terms. Reference the evaluation score when relevant. "
        "Ask the student to analyze before giving guidance. Never give the answer directly."
    ),
}


async def get_coach_response(req: CoachRequest) -> str:
    api_key = os.environ["GEMMA_API_KEY"]
    system = SYSTEM_PROMPTS[req.track]

    history_text = "\n".join(
        f"{'Coach' if m.role == 'coach' else 'Student'}: {m.text}"
        for m in req.history[-6:]
    )

    user_content = (
        f"Board (FEN): {req.fen}\n"
        f"Last move: {req.lastMove}\n"
        f"Evaluation: {req.evaluation:+.1f} pawns\n"
        f"Best move available: {req.bestMove}\n"
        f"Lesson topic: {req.lessonTopic}\n"
        f"\nConversation so far:\n{history_text}\n"
        f"\nStudent says: {req.userMessage}"
    )

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent",
            headers={"x-goog-api-key": api_key},
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"parts": [{"text": user_content}]}],
                "generationConfig": {"maxOutputTokens": 150, "temperature": 0.7},
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
