# Chess AI Tutor — Design Spec
Date: 2026-03-10

## Overview

A voice-first chess tutor web app for kids aged 6–15. An AI coach named **Magnus** teaches chess through structured lessons and live-coached practice games. The app adapts vocabulary, board complexity, and AI difficulty based on the child's age and skill level.

Three learning tracks: Explorer (6–8), Adventurer (8–12), Champion (12–15). Explorer-track kids start on progressive mini-boards before graduating to the full 8×8 game.

---

## Architecture

Two deployable units communicating via a single REST endpoint.

**Frontend** — React 19 + TypeScript + Vite, deployed to Firebase Hosting.
**Backend** — FastAPI (Python 3.12), deployed to Cloud Run.

All game state lives in the frontend. The backend is stateless — it receives full context per request and returns one coach message.

```
chess-game/
├── frontend/     # React app
├── backend/      # FastAPI app
├── harness/      # AI session context
└── CLAUDE.md
```

---

## Frontend

### Tech Stack

- React 19 + TypeScript (Vite 7)
- react-chessboard 5 — board UI with drag-and-drop
- chess.js 1.4 — move validation and game state (full 8×8 only)
- Stockfish 18 WASM — Web Worker, depth 15 analysis
- Web Speech API — browser-native voice input and synthesis
- Firebase Auth — Google Sign-In
- Firebase Firestore — user progress persistence
- Vitest 4 + React Testing Library — tests

### Routing

```
/login          → LoginPage (Google Sign-In)
/onboarding     → Onboarding (4-step quiz)
/mini           → MiniStage (Explorer track, stages 1–4)
/game           → GamePage (full 8×8, all tracks)
```

After login: check Firestore → new user goes to `/onboarding` → route based on track. Returning users land on `/mini` or `/game` based on `miniBoardStage`.

### Component Hierarchy

```
App
├── LoginPage
├── Onboarding (useOnboarding → track assignment)
├── MiniStage (useMiniChess + MiniChess.ts engine)
│   ├── ChessBoard (shared)
│   └── CoachPanel (shared)
└── GamePage (useChessGame + useStockfish + useMoveHints)
    ├── ChessBoard (shared)
    └── CoachPanel (shared)
```

`ChessBoard` and `CoachPanel` are shared components used by both `MiniStage` and `GamePage`.

### Layout

**Stacked (mobile-first):** Board on top, coach bar anchored below. Portrait-friendly for phones and tablets.

### Visual Style

**Night Wizard:** Deep navy backgrounds, gold accents (Magnus avatar, active elements), blue coach text. Dark throughout — no bright backgrounds.

### File Structure

```
frontend/src/
├── components/
│   ├── Board/          # ChessBoard
│   ├── Game/           # GamePage
│   ├── Coach/          # CoachPanel
│   ├── MiniBoard/      # MiniStage
│   ├── Login/          # LoginPage
│   └── Onboarding/     # 4-step quiz
├── hooks/
│   ├── useChessGame.ts     # chess.js wrapper
│   ├── useStockfish.ts     # Stockfish WASM Web Worker
│   ├── useVoice.ts         # Speech recognition + synthesis
│   ├── useMoveHints.ts     # Toggle + localStorage persistence
│   ├── useMiniChess.ts     # Mini-board game logic
│   ├── useFirestore.ts     # Read/write user progress
│   └── useOnboarding.ts    # Track determination
├── engine/
│   ├── MiniChess.ts        # Custom engine for mini-boards
│   └── stageConfigs.ts     # 4 progressive board configurations
├── services/
│   ├── firebase.ts         # Firebase init
│   └── coachApi.ts         # POST /coach/respond
└── types/index.ts
```

### Key Frontend Features

**Progressive Mini-Board System (Explorer track)**

| Stage | Board | Pieces |
|---|---|---|
| 1 | 3×3 | King + Rook |
| 2 | 4×4 | King, Rook, Bishop |
| 3 | 6×6 | King, Queen, Rook, Bishop, Pawns |
| 4 | 6×6 | Full set (add Knights) |

`MiniChess.ts` is a custom engine (not chess.js) with its own legal move generation, win/draw detection, and FEN-like state. Win 3 times at a stage → promote. After Stage 4, set `miniBoardStage = 5` and route to `GamePage`.

**Full Chess Game (GamePage)**
- Drag-and-drop + click-to-move via react-chessboard
- Move hint toggle (💡): legal destination squares shown as green dots, persisted in localStorage (`'chess-move-hints'`, default `true`)
- Stockfish WASM analysis after each player move (depth 15) — extracts centipawn eval and best move UCI
- Blunder detection: >200cp drop triggers coach review prompt
- Adaptive AI: Stockfish `Skill Level` 0–20, adjusted ±1 per game based on win/loss, persisted in Firestore

**CoachPanel**
- Night Wizard theme: dark navy, gold Magnus avatar, blue speech bubble text
- Auto-speaks every coach message via `useVoice` (Web Speech API synthesis)
- Mic button for kid to speak; transcript sent to backend
- Context sent with every request: FEN, last move, eval, best move, lesson topic, track, last N messages

**Coach persona per track:**
- Explorer: story metaphors, simple words ("the rook is like a train")
- Adventurer: Socratic questions, opening principles
- Champion: technical terms, evaluation-aware responses

Magnus never gives the answer directly — Socratic method throughout.

**Onboarding (4 steps)**
1. Experience: "Have you played before?" → Yes / A little / Never
2. Age: Slider 4–18
3. Knowledge test: "Can a rook move diagonally?" → determines track
4. Name: for personalization

---

## Backend

### Tech Stack

- FastAPI (Python 3.12, uvicorn)
- Gemma 3 27B (Google AI Studio API)
- Firebase Admin SDK
- uv for dependency management

### Structure

```
backend/
├── main.py              # FastAPI app, CORS
├── routers/coach.py     # POST /coach/respond
├── models/schemas.py    # Pydantic request/response models
├── services/gemma.py    # Gemma 3 API + system prompt builder
└── pyproject.toml
```

### Coach Endpoint

`POST /coach/respond`

Request:
```json
{
  "fen": "...",
  "lastMove": "e2e4",
  "evaluation": 0.3,
  "bestMove": "d7d5",
  "lessonTopic": "controlling the center",
  "track": "adventurer",
  "history": [{"role": "coach", "text": "..."}, ...],
  "userMessage": "I moved my pawn"
}
```

Response:
```json
{ "message": "Nice move! Why did you choose that square?" }
```

`gemma.py` builds a per-track system prompt enforcing the Magnus persona and Socratic method, then calls Gemma 3 27B with full context.

### System Prompts

- **Explorer:** Simple vocabulary, story metaphors, encouraging tone
- **Adventurer:** Socratic questions, introduce opening principles
- **Champion:** Technical chess terms, evaluation-aware ("you're up +1.4, what does that tell you?")

All three prompts enforce: Magnus never reveals the answer directly.

---

## Data

### Firestore Schema

```
users/{uid}
  name, track, skillLevel (0–20), miniBoardStage (1–5),
  winsAtCurrentStage, currentLesson, piecesUnlocked[],
  puzzlesSolved, gamesPlayed

users/{uid}/games/{gameId}
  fen, pgn, blunders[], opponentLevel, date, coachNotes
```

### Adaptive Difficulty

Stockfish `Skill Level` starts at 5. Adjust ±1 after each game based on win/loss. Range 0–20. Persisted as `skillLevel` in Firestore.

---

## Data Flow

```
Kid moves piece
  → useChessGame / useMiniChess updates FEN
  → useStockfish analyzes (depth 15)
  → eval + best move extracted
  → (blunder?) coach prompts review
  → coachApi POST /coach/respond
  → FastAPI → Gemma 3 → coach text
  → useVoice speaks response
  → CoachPanel displays message
  → (game over?) useFirestore saves game record
```

---

## Testing

**Stack:** Vitest 4 + React Testing Library (frontend), pytest (backend).

**Frontend test coverage:**
- `ChessBoard` — renders, fires `onSquareClick`, shows highlight squares
- `GamePage` — board + coach panel render, hint toggle persists in localStorage
- `MiniStage` — all 4 stages render, 3-win advancement, hint toggle
- `useChessGame` — move execution, legal move detection, game over
- `useMiniChess` — custom engine moves, win detection per stage config
- `useMoveHints` — toggle persists, defaults to `true`
- `useVoice` — speak/listen with mocked Web Speech API
- `useFirestore` — reads/writes user profile, saves game record
- `useOnboarding` — correct track from quiz answers
- `coachApi` — POST shape and response parsing

**Test setup:**
- Mock `react-chessboard` → `<div data-testid="chess-board">`
- Mock `firebase/auth` and `firebase/firestore`
- Mock Stockfish Web Worker
- In-memory localStorage mock, cleared in `beforeEach`

**Backend:** pytest for coach router — mock Gemma API, assert response shape and track-appropriate system prompt content.

**Gate:** `harness/scripts/test.sh` must pass before any feature is marked `tested` in `status.json`.

---

## Deployment

**Frontend** (`firebase.json`):
```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

**Backend** (`Dockerfile`):
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install uv && uv sync
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

`COACH_API_URL` env var injected at frontend build time.

---

## Build Order

Follow the spec's 21-step sequence:

1. Vite + React + TypeScript frontend scaffold
2. Install deps: chess.js, react-chessboard, firebase, stockfish
3. Configure Firebase project (Auth + Firestore + Hosting)
4. Build LoginPage (Google Sign-In)
5. Build Onboarding component (4-step quiz → track)
6. Build useFirestore hook (read/write user profile)
7. Build ChessBoard component (drag+click, highlight squares)
8. Build useChessGame hook (chess.js wrapper)
9. Build useStockfish hook (Stockfish WASM Web Worker)
10. Build useMoveHints hook (localStorage toggle)
11. Build GamePage (click-to-move, hints, Stockfish, coach integration)
12. Build MiniChess.ts engine + stageConfigs.ts
13. Build useMiniChess hook
14. Build MiniStage component (all 4 stages, advancement logic)
15. Build useVoice hook (Web Speech API)
16. Build CoachPanel (chat UI + voice synthesis)
17. Build coachApi.ts service (POST /coach/respond)
18. Build FastAPI backend (schemas, Gemma service, coach router)
19. Wire routing: Login → Onboarding → MiniStage (Explorer) or GamePage
20. Write tests for all components, hooks, services
21. Deploy frontend to Firebase Hosting, backend to Cloud Run
