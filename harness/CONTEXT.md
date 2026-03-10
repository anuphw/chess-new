# Project Context

> This file is read by Claude Code at the start of every session.

## Tech Stack
- Frontend: React 19 + TypeScript, Vite 7, chess.js 1.4, react-chessboard 5, Stockfish 18 WASM, Web Speech API, Firebase Auth/Firestore
- Backend: FastAPI, Python 3.12, uv, Gemma 3 27B (Google AI Studio)
- Testing: Vitest 4 + React Testing Library (frontend), pytest (backend)
- Deployment: Firebase Hosting (frontend), Cloud Run (backend)

## Architecture
Voice-first chess tutor for kids aged 6–15. React frontend handles all game state and communicates with a stateless FastAPI backend via POST /coach/respond. Magnus (AI coach) adapts to three tracks: Explorer (6–8), Adventurer (8–12), Champion (12–15).

## Key File Paths
- Frontend entry: `frontend/src/main.tsx`
- App routing: `frontend/src/App.tsx`
- Types: `frontend/src/types/index.ts`
- Tests: alongside each component/hook (*.test.tsx)
- Backend entry: `backend/main.py`
- Coach endpoint: `backend/routers/coach.py`

## Important Decisions
- MiniChess.ts is a custom engine (not chess.js) — handles 3×3, 4×4, 6×6 boards
- All game state lives in the frontend; backend is stateless
- Stacked layout: board on top, coach bar below (mobile-first)
- Night Wizard theme: dark navy (#0f1923), gold (#ffd200), blue (#7eb8f7)
- Stockfish runs in a Web Worker (stockfish.worker.ts) to avoid blocking the UI

## Gotchas
- Use `uv run python` for all Python commands
- Firebase config via VITE_* env vars in frontend/.env.local (not committed)
- Stockfish WASM requires special Vite config (headers for SharedArrayBuffer)
- Web Speech API is not available in test environment — must be mocked
- Run tests from the `frontend/` directory: `cd frontend && npm test`
