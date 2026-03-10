from pydantic import BaseModel
from typing import Literal


class CoachMessage(BaseModel):
    role: Literal['coach', 'user']
    text: str


class CoachRequest(BaseModel):
    fen: str
    lastMove: str
    evaluation: float
    bestMove: str
    lessonTopic: str
    track: Literal['explorer', 'adventurer', 'champion']
    history: list[CoachMessage]
    userMessage: str


class CoachResponse(BaseModel):
    message: str
