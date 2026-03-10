import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app
from services.gemma import SYSTEM_PROMPTS

client = TestClient(app)


def make_request(track="adventurer"):
    return {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "lastMove": "e2e4",
        "evaluation": 0.3,
        "bestMove": "d7d5",
        "lessonTopic": "rook",
        "track": track,
        "history": [],
        "userMessage": "I moved my pawn",
    }


@patch("routers.coach.get_coach_response", new_callable=AsyncMock, return_value="Good thinking!")
def test_coach_endpoint_returns_message(mock_gemma):
    res = client.post("/coach/respond", json=make_request())
    assert res.status_code == 200
    assert res.json()["message"] == "Good thinking!"


def test_system_prompt_contains_track_appropriate_content():
    assert "Socratic" in SYSTEM_PROMPTS["adventurer"]
    assert "train" in SYSTEM_PROMPTS["explorer"]
    assert "evaluation" in SYSTEM_PROMPTS["champion"].lower() or "technical" in SYSTEM_PROMPTS["champion"].lower()


def test_system_prompts_all_forbid_giving_answer():
    for track, prompt in SYSTEM_PROMPTS.items():
        assert "never" in prompt.lower() or "not" in prompt.lower(), \
            f"Track '{track}' system prompt does not mention withholding answers"
