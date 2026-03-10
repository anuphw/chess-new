# Chess AI Tutor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-first chess tutor web app for kids with AI coach Magnus, progressive mini-boards, and full 8×8 chess with Stockfish analysis.

**Architecture:** React 19 + TypeScript frontend (Firebase Hosting) communicating with a stateless FastAPI backend (Cloud Run) via POST /coach/respond. All game state lives in the frontend; the backend receives full context per request and returns one coach message.

**Tech Stack:** React 19, TypeScript, Vite 7, chess.js 1.4, react-chessboard 5, Stockfish 18 WASM, Web Speech API, Firebase Auth/Firestore, Vitest 4 + RTL, FastAPI, Python 3.12, uv, Gemma 3 27B.

---

## File Map

### Frontend
```
frontend/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/index.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   └── coachApi.ts
│   ├── hooks/
│   │   ├── useFirestore.ts
│   │   ├── useOnboarding.ts
│   │   ├── useChessGame.ts
│   │   ├── useStockfish.ts
│   │   ├── useMoveHints.ts
│   │   ├── useMiniChess.ts
│   │   └── useVoice.ts
│   ├── engine/
│   │   ├── MiniChess.ts
│   │   └── stageConfigs.ts
│   ├── components/
│   │   ├── Login/LoginPage.tsx
│   │   ├── Onboarding/Onboarding.tsx
│   │   ├── Board/ChessBoard.tsx
│   │   ├── Coach/CoachPanel.tsx
│   │   ├── Game/GamePage.tsx
│   │   └── MiniBoard/MiniStage.tsx
│   ├── workers/
│   │   └── stockfish.worker.ts
│   └── test/
│       └── setup.ts
```

### Backend
```
backend/
├── main.py
├── routers/coach.py
├── models/schemas.py
├── services/gemma.py
├── tests/test_coach.py
├── pyproject.toml
└── Dockerfile
```

### Config
```
firebase.json
.firebaserc
.env.example
harness/CONTEXT.md   (fill in)
harness/status.json  (fill in)
```

---

## Chunk 1: Foundation — Scaffold, Firebase, Auth, Onboarding, Firestore

### Task 1: Scaffold frontend project

**Files:**
- Create: `frontend/` (Vite scaffold)
- Create: `frontend/src/test/setup.ts`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Scaffold Vite project**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install app dependencies**

```bash
npm install chess.js react-chessboard firebase react-router-dom
npm install stockfish
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 5: Create test setup**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// In-memory localStorage mock
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => localStorageMock.clear())
```

- [ ] **Step 6: Add test script to package.json**

In `frontend/package.json`, add to scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Run tests to verify setup**

```bash
cd frontend && npm test -- --passWithNoTests
```

Expected: exit code 0, output shows "No test files found".

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend with Vite + Vitest"
```

---

### Task 2: Shared types

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Create types**

```typescript
// frontend/src/types/index.ts
export type Track = 'explorer' | 'adventurer' | 'champion'

export interface UserProfile {
  uid: string
  name: string
  track: Track
  skillLevel: number        // 0–20 Stockfish skill
  miniBoardStage: number    // 1–5 (5 = graduated to full game)
  winsAtCurrentStage: number
  currentLesson: string
  piecesUnlocked: string[]
  puzzlesSolved: number
  gamesPlayed: number
}

export interface GameRecord {
  fen: string
  pgn: string
  blunders: string[]
  opponentLevel: number
  date: string
  coachNotes: string
}

export interface CoachMessage {
  role: 'coach' | 'user'
  text: string
}

export interface CoachRequest {
  fen: string
  lastMove: string
  evaluation: number
  bestMove: string
  lessonTopic: string
  track: Track
  history: CoachMessage[]
  userMessage: string
}

export interface MiniChessState {
  board: (string | null)[][]
  currentPlayer: 'w' | 'b'
  isOver: boolean
  winner: 'w' | 'b' | 'draw' | null
  stage: number
}

export interface StageConfig {
  stage: number
  rows: number
  cols: number
  pieces: string[]  // piece types available
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Firebase service

**Files:**
- Create: `frontend/src/services/firebase.ts`
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# .env.example (copy to .env.local and fill in)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_COACH_API_URL=http://localhost:8000
```

- [ ] **Step 2: Create firebase.ts**

```typescript
// frontend/src/services/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 3: Smoke-test firebase.ts compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 4: Add .env.local to .gitignore and commit**

```bash
echo ".env.local" >> .gitignore
git add .env.example .gitignore frontend/src/services/firebase.ts
git commit -m "feat: add Firebase service init"
```

---

### Task 4: LoginPage component

**Files:**
- Create: `frontend/src/components/Login/LoginPage.tsx`
- Create: `frontend/src/components/Login/LoginPage.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// frontend/src/components/Login/LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LoginPage from './LoginPage'

vi.mock('../../services/firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({ user: { uid: '123' } }),
}))

test('renders sign-in button', () => {
  render(<LoginPage onLogin={vi.fn()} />)
  expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
})

test('calls onLogin after successful sign-in', async () => {
  const onLogin = vi.fn()
  render(<LoginPage onLogin={onLogin} />)
  fireEvent.click(screen.getByText(/sign in with google/i))
  await vi.waitFor(() => expect(onLogin).toHaveBeenCalled())
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd frontend && npm test -- LoginPage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement LoginPage**

```typescript
// frontend/src/components/Login/LoginPage.tsx
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../services/firebase'

interface Props {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: Props) {
  async function handleSignIn() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    onLogin()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>♟</div>
      <h1 style={{ color: '#ffd200', fontFamily: 'sans-serif', marginBottom: 8 }}>Magnus</h1>
      <p style={{ color: '#7eb8f7', marginBottom: 32, fontFamily: 'sans-serif' }}>Your Chess Coach</p>
      <button
        onClick={handleSignIn}
        style={{ background: '#ffd200', color: '#0f1923', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif' }}
      >
        Sign in with Google
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd frontend && npm test -- LoginPage
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Login/
git commit -m "feat: add LoginPage with Google Sign-In"
```

---

### Task 5: useOnboarding hook

**Files:**
- Create: `frontend/src/hooks/useOnboarding.ts`
- Create: `frontend/src/hooks/useOnboarding.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useOnboarding.test.ts
import { determineTrack } from './useOnboarding'

test('never played + age 7 + wrong answer → explorer', () => {
  expect(determineTrack({ experience: 'never', age: 7, knowledgeCorrect: false })).toBe('explorer')
})

test('played before + age 10 + correct answer → adventurer', () => {
  expect(determineTrack({ experience: 'yes', age: 10, knowledgeCorrect: true })).toBe('adventurer')
})

test('played before + age 13 + correct answer → champion', () => {
  expect(determineTrack({ experience: 'yes', age: 13, knowledgeCorrect: true })).toBe('champion')
})

test('a little experience + age 8 + correct → adventurer', () => {
  expect(determineTrack({ experience: 'a-little', age: 8, knowledgeCorrect: true })).toBe('adventurer')
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useOnboarding
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useOnboarding.ts
import { useState } from 'react'
import type { Track } from '../types'

interface OnboardingAnswers {
  experience: 'yes' | 'a-little' | 'never'
  age: number
  knowledgeCorrect: boolean
}

export function determineTrack({ experience, age, knowledgeCorrect }: OnboardingAnswers): Track {
  if (experience === 'never' || !knowledgeCorrect || age < 8) return 'explorer'
  if (age >= 12 && experience === 'yes' && knowledgeCorrect) return 'champion'
  return 'adventurer'
}

export interface OnboardingState {
  step: number
  experience: OnboardingAnswers['experience'] | null
  age: number
  knowledgeCorrect: boolean | null
  name: string
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    experience: null,
    age: 10,
    knowledgeCorrect: null,
    name: '',
  })

  function setExperience(experience: OnboardingAnswers['experience']) {
    setState(s => ({ ...s, experience, step: 2 }))
  }

  function setAge(age: number) {
    setState(s => ({ ...s, age, step: 3 }))
  }

  function setKnowledge(correct: boolean) {
    setState(s => ({ ...s, knowledgeCorrect: correct, step: 4 }))
  }

  function setName(name: string) {
    setState(s => ({ ...s, name }))
  }

  function getTrack(): Track {
    return determineTrack({
      experience: state.experience ?? 'never',
      age: state.age,
      knowledgeCorrect: state.knowledgeCorrect ?? false,
    })
  }

  return { state, setExperience, setAge, setKnowledge, setName, getTrack }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useOnboarding
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useOnboarding.ts frontend/src/hooks/useOnboarding.test.ts
git commit -m "feat: add useOnboarding hook with track determination"
```

---

### Task 6: Onboarding component

**Files:**
- Create: `frontend/src/components/Onboarding/Onboarding.tsx`
- Create: `frontend/src/components/Onboarding/Onboarding.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/components/Onboarding/Onboarding.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Onboarding from './Onboarding'

test('renders step 1 — experience question', () => {
  render(<Onboarding onComplete={vi.fn()} />)
  expect(screen.getByText(/have you played before/i)).toBeInTheDocument()
})

test('advances to step 2 after experience selection', () => {
  render(<Onboarding onComplete={vi.fn()} />)
  fireEvent.click(screen.getByText(/never/i))
  expect(screen.getByText(/how old are you/i)).toBeInTheDocument()
})

test('calls onComplete with name and track after all steps', async () => {
  const onComplete = vi.fn()
  render(<Onboarding onComplete={onComplete} />)
  fireEvent.click(screen.getByText(/never/i))
  fireEvent.click(screen.getByText(/next/i))
  fireEvent.click(screen.getByText(/no/i))
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Alex' } })
  fireEvent.click(screen.getByText(/let's go/i))
  expect(onComplete).toHaveBeenCalledWith({ name: 'Alex', track: 'explorer' })
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- Onboarding
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/components/Onboarding/Onboarding.tsx
import { useOnboarding } from '../../hooks/useOnboarding'
import type { Track } from '../../types'

interface Props {
  onComplete: (result: { name: string; track: Track }) => void
}

const btn = {
  background: '#ffd200', color: '#0f1923', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 15,
  fontWeight: 'bold', cursor: 'pointer', margin: 4,
}
const wrap = {
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
  justifyContent: 'center', minHeight: '100vh', background: '#0f1923',
  color: '#e2e8f0', fontFamily: 'sans-serif', gap: 16,
}

export default function Onboarding({ onComplete }: Props) {
  const { state, setExperience, setAge, setKnowledge, setName, getTrack } = useOnboarding()

  if (state.step === 1) return (
    <div style={wrap}>
      <h2>Have you played before?</h2>
      <button style={btn} onClick={() => setExperience('yes')}>Yes</button>
      <button style={btn} onClick={() => setExperience('a-little')}>A little</button>
      <button style={btn} onClick={() => setExperience('never')}>Never</button>
    </div>
  )

  if (state.step === 2) return (
    <div style={wrap}>
      <h2>How old are you?</h2>
      <input type="range" min={4} max={18} value={state.age}
        onChange={e => setAge(Number(e.target.value))} />
      <p>{state.age} years old</p>
      <button style={btn} onClick={() => setAge(state.age)}>Next</button>
    </div>
  )

  if (state.step === 3) return (
    <div style={wrap}>
      <h2>Can a rook move diagonally?</h2>
      <button style={btn} onClick={() => setKnowledge(false)}>No</button>
      <button style={btn} onClick={() => setKnowledge(true)}>Yes</button>
    </div>
  )

  return (
    <div style={wrap}>
      <h2>What&apos;s your name?</h2>
      <input
        placeholder="Your name"
        value={state.name}
        onChange={e => setName(e.target.value)}
        style={{ padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 16 }}
      />
      <button style={btn} onClick={() => onComplete({ name: state.name, track: getTrack() })}>
        Let&apos;s go!
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- Onboarding
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Onboarding/
git commit -m "feat: add Onboarding component (4-step quiz)"
```

---

### Task 7: useFirestore hook

**Files:**
- Create: `frontend/src/hooks/useFirestore.ts`
- Create: `frontend/src/hooks/useFirestore.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useFirestore.test.ts
import { vi } from 'vitest'
import { saveUserProfile, loadUserProfile, saveGameRecord } from './useFirestore'

const mockDoc = vi.fn()
const mockSetDoc = vi.fn().mockResolvedValue(undefined)
const mockGetDoc = vi.fn()

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'game1' })

vi.mock('../../services/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  collection: vi.fn(),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
}))

test('saveUserProfile calls setDoc with correct data', async () => {
  const profile = { uid: 'u1', name: 'Alex', track: 'explorer' as const, skillLevel: 5,
    miniBoardStage: 1, winsAtCurrentStage: 0, currentLesson: 'rook',
    piecesUnlocked: [], puzzlesSolved: 0, gamesPlayed: 0 }
  await saveUserProfile(profile)
  expect(mockSetDoc).toHaveBeenCalled()
})

test('loadUserProfile returns null when doc does not exist', async () => {
  mockGetDoc.mockResolvedValueOnce({ exists: () => false })
  const result = await loadUserProfile('u1')
  expect(result).toBeNull()
})

test('loadUserProfile returns data when doc exists', async () => {
  const data = { name: 'Alex', track: 'explorer' }
  mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => data })
  const result = await loadUserProfile('u1')
  expect(result).toEqual(data)
})

test('saveGameRecord calls addDoc with game data', async () => {
  const game = { fen: 'start', pgn: '', blunders: [], opponentLevel: 5, date: '2026-03-10', coachNotes: '' }
  await saveGameRecord('u1', game)
  expect(mockAddDoc).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useFirestore
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useFirestore.ts
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { UserProfile, GameRecord } from '../types'

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { uid, ...data } = profile
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function loadUserProfile(uid: string): Promise<Omit<UserProfile, 'uid'> | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as Omit<UserProfile, 'uid'>
}

export async function saveGameRecord(uid: string, game: GameRecord): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'games'), game)
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useFirestore
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useFirestore.ts frontend/src/hooks/useFirestore.test.ts
git commit -m "feat: add useFirestore hook (read/write user profile and games)"
```

---

### Task 8: Update harness context

**Files:**
- Modify: `harness/CONTEXT.md`
- Modify: `harness/status.json`
- Modify: `harness/scripts/test.sh`

- [ ] **Step 1: Fill in CONTEXT.md**

Replace the placeholder content with:

```markdown
# Project Context

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
- Firebase config via VITE_* env vars in .env.local (not committed)
- Stockfish WASM requires special Vite config (headers for SharedArrayBuffer)
- Web Speech API is not available in test environment — must be mocked
```

- [ ] **Step 2: Update status.json**

```json
{
  "last_updated": "2026-03-10",
  "session_summary": "Foundation complete: scaffold, types, Firebase, LoginPage, useOnboarding, Onboarding, useFirestore.",
  "features": [
    { "id": "scaffold", "name": "Frontend scaffold + Vitest", "status": "tested" },
    { "id": "types", "name": "Shared TypeScript types", "status": "tested" },
    { "id": "firebase", "name": "Firebase service init", "status": "tested" },
    { "id": "login", "name": "LoginPage (Google Sign-In)", "status": "tested" },
    { "id": "onboarding", "name": "Onboarding component + useOnboarding", "status": "tested" },
    { "id": "firestore", "name": "useFirestore hook", "status": "tested" },
    { "id": "chess-board", "name": "ChessBoard component", "status": "pending" },
    { "id": "use-chess-game", "name": "useChessGame hook", "status": "pending" },
    { "id": "use-stockfish", "name": "useStockfish hook", "status": "pending" },
    { "id": "use-move-hints", "name": "useMoveHints hook", "status": "pending" },
    { "id": "game-page", "name": "GamePage", "status": "pending" },
    { "id": "mini-chess-engine", "name": "MiniChess.ts + stageConfigs", "status": "pending" },
    { "id": "use-mini-chess", "name": "useMiniChess hook", "status": "pending" },
    { "id": "mini-stage", "name": "MiniStage component", "status": "pending" },
    { "id": "use-voice", "name": "useVoice hook", "status": "pending" },
    { "id": "coach-panel", "name": "CoachPanel component", "status": "pending" },
    { "id": "coach-api", "name": "coachApi.ts service", "status": "pending" },
    { "id": "backend", "name": "FastAPI backend", "status": "pending" },
    { "id": "routing", "name": "App routing", "status": "pending" },
    { "id": "tests", "name": "Full test suite", "status": "pending" },
    { "id": "deploy", "name": "Deploy to Firebase + Cloud Run", "status": "pending" }
  ],
  "next_actions": [
    "Build ChessBoard component (Task 9)",
    "Build useChessGame hook (Task 10)"
  ]
}
```

- [ ] **Step 3: Update harness test script to run frontend tests**

Replace the body of `harness/scripts/test.sh` with:

```bash
#!/bin/bash
set -e
echo "=== Running frontend tests ==="
cd "$(dirname "$0")/../../frontend"
npm test

# Note: the backend section below will fail until Task 20 (FastAPI backend) is complete.
# During Chunks 1–3, run frontend tests directly with: cd frontend && npm test
echo "=== Running backend tests ==="
cd "$(dirname "$0")/../../backend"
uv run pytest
```

Make it executable:

```bash
chmod +x harness/scripts/test.sh
```

Verify it runs without error (frontend only, backend not yet set up):

```bash
cd frontend && npm test
```

Expected: all frontend tests pass.

- [ ] **Step 4: Commit**

```bash
git add harness/CONTEXT.md harness/status.json harness/scripts/test.sh
git commit -m "chore: update harness context, status, and test script"
```

---

## Chunk 2: Chess Game Core — ChessBoard, useChessGame, useStockfish, useMoveHints, GamePage

### Task 9: ChessBoard component

**Files:**
- Create: `frontend/src/components/Board/ChessBoard.tsx`
- Create: `frontend/src/components/Board/ChessBoard.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/components/Board/ChessBoard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ChessBoard from './ChessBoard'

vi.mock('react-chessboard', () => ({
  Chessboard: ({ onSquareClick, customSquareStyles }: { onSquareClick: (sq: string) => void, customSquareStyles: Record<string, unknown> }) => (
    <div data-testid="chess-board" onClick={() => onSquareClick('e2')}>
      {Object.keys(customSquareStyles || {}).map(sq => (
        <div key={sq} data-testid={`highlight-${sq}`} />
      ))}
    </div>
  ),
}))

test('renders chess board', () => {
  render(<ChessBoard fen="start" onSquareClick={vi.fn()} highlightedSquares={[]} />)
  expect(screen.getByTestId('chess-board')).toBeInTheDocument()
})

test('calls onSquareClick when board is clicked', () => {
  const onClick = vi.fn()
  render(<ChessBoard fen="start" onSquareClick={onClick} highlightedSquares={[]} />)
  fireEvent.click(screen.getByTestId('chess-board'))
  expect(onClick).toHaveBeenCalledWith('e2')
})

test('renders highlight squares', () => {
  render(<ChessBoard fen="start" onSquareClick={vi.fn()} highlightedSquares={['e4', 'e3']} />)
  expect(screen.getByTestId('highlight-e4')).toBeInTheDocument()
  expect(screen.getByTestId('highlight-e3')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- ChessBoard
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/components/Board/ChessBoard.tsx
import { Chessboard } from 'react-chessboard'
import type { Square } from 'chess.js'

interface Props {
  fen: string
  onSquareClick: (square: Square) => void
  highlightedSquares: Square[]
  boardOrientation?: 'white' | 'black'
  disabled?: boolean
}

export default function ChessBoard({ fen, onSquareClick, highlightedSquares, boardOrientation = 'white', disabled = false }: Props) {
  const customSquareStyles = Object.fromEntries(
    highlightedSquares.map(sq => [sq, {
      background: 'radial-gradient(circle, rgba(0,200,100,0.6) 25%, transparent 25%)',
      borderRadius: '50%',
    }])
  )

  return (
    <Chessboard
      position={fen}
      onSquareClick={disabled ? undefined : onSquareClick}
      customSquareStyles={customSquareStyles}
      boardOrientation={boardOrientation}
    />
  )
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- ChessBoard
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Board/
git commit -m "feat: add ChessBoard component with highlight squares"
```

---

### Task 10: useChessGame hook

**Files:**
- Create: `frontend/src/hooks/useChessGame.ts`
- Create: `frontend/src/hooks/useChessGame.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useChessGame.test.ts
import { renderHook, act } from '@testing-library/react'
import { useChessGame } from './useChessGame'

test('initial position FEN is the standard start', () => {
  const { result } = renderHook(() => useChessGame())
  expect(result.current.fen).toContain('rnbqkbnr')
})

test('makeMove updates FEN after legal move', () => {
  const { result } = renderHook(() => useChessGame())
  act(() => { result.current.makeMove('e2', 'e4') })
  expect(result.current.fen).not.toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w')
})

test('makeMove returns false for illegal move', () => {
  const { result } = renderHook(() => useChessGame())
  let success: boolean
  act(() => { success = result.current.makeMove('e2', 'e5') })
  expect(success!).toBe(false)
})

test('getLegalMoves returns squares for a piece', () => {
  const { result } = renderHook(() => useChessGame())
  const moves = result.current.getLegalMoves('e2')
  expect(moves).toContain('e3')
  expect(moves).toContain('e4')
})

test('isGameOver is false at start', () => {
  const { result } = renderHook(() => useChessGame())
  expect(result.current.isGameOver).toBe(false)
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useChessGame
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useChessGame.ts
import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

export function useChessGame() {
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState(chess.fen())
  const [lastMove, setLastMove] = useState<string | null>(null)

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    try {
      const move = chess.move({ from, to, promotion: 'q' })
      if (!move) return false
      setFen(chess.fen())
      setLastMove(`${from}${to}`)
      return true
    } catch {
      return false
    }
  }, [chess])

  const getLegalMoves = useCallback((square: Square): Square[] => {
    return chess.moves({ square, verbose: true }).map(m => m.to as Square)
  }, [chess])

  const reset = useCallback(() => {
    chess.reset()
    setFen(chess.fen())
    setLastMove(null)
  }, [chess])

  return {
    fen,
    lastMove,
    isGameOver: chess.isGameOver(),
    isCheck: chess.inCheck(),
    turn: chess.turn(),
    makeMove,
    getLegalMoves,
    reset,
    pgn: () => chess.pgn(),
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useChessGame
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useChessGame.ts frontend/src/hooks/useChessGame.test.ts
git commit -m "feat: add useChessGame hook (chess.js wrapper)"
```

---

### Task 11: useStockfish hook

**Files:**
- Create: `frontend/src/workers/stockfish.worker.ts`
- Create: `frontend/src/hooks/useStockfish.ts`
- Create: `frontend/src/hooks/useStockfish.test.ts`

- [ ] **Step 1: Create Stockfish worker**

```typescript
// frontend/src/workers/stockfish.worker.ts
import Stockfish from 'stockfish'

const engine = Stockfish()
engine.onmessage = (msg: string) => postMessage(msg)
onmessage = (e: MessageEvent) => engine.postMessage(e.data)
```

- [ ] **Step 2: Write failing tests**

```typescript
// frontend/src/hooks/useStockfish.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// Mock the Web Worker
const mockWorker = {
  postMessage: vi.fn(),
  onmessage: null as ((e: MessageEvent) => void) | null,
  terminate: vi.fn(),
}
vi.stubGlobal('Worker', vi.fn(() => mockWorker))

import { useStockfish } from './useStockfish'

test('analyze posts UCI commands to worker', async () => {
  const { result } = renderHook(() => useStockfish())
  act(() => result.current.analyze('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 15))
  expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.stringContaining('position fen'))
})

test('analysis result is null initially', () => {
  const { result } = renderHook(() => useStockfish())
  expect(result.current.analysis).toBeNull()
})

test('parses bestmove from engine output', async () => {
  const { result } = renderHook(() => useStockfish())
  act(() => {
    mockWorker.onmessage?.({ data: 'info depth 15 score cp 30 pv e7e5' } as MessageEvent)
    mockWorker.onmessage?.({ data: 'bestmove e7e5 ponder d2d4' } as MessageEvent)
  })
  await waitFor(() => expect(result.current.analysis?.bestMove).toBe('e7e5'))
})
```

- [ ] **Step 3: Run — verify fail**

```bash
cd frontend && npm test -- useStockfish
```

- [ ] **Step 4: Implement**

```typescript
// frontend/src/hooks/useStockfish.ts
import { useState, useEffect, useRef, useCallback } from 'react'

export interface StockfishAnalysis {
  evaluation: number  // centipawns (positive = white advantage)
  bestMove: string    // UCI string e.g. "e2e4"
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null)
  const [analysis, setAnalysis] = useState<StockfishAnalysis | null>(null)
  const evalRef = useRef<number>(0)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/stockfish.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.postMessage('uci')
    worker.postMessage('isready')

    worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : e.data.toString()

      const cpMatch = line.match(/score cp (-?\d+)/)
      if (cpMatch) evalRef.current = parseInt(cpMatch[1])

      const bmMatch = line.match(/^bestmove (\S+)/)
      if (bmMatch && bmMatch[1] !== '(none)') {
        setAnalysis({ evaluation: evalRef.current, bestMove: bmMatch[1] })
      }
    }

    return () => worker.terminate()
  }, [])

  const analyze = useCallback((fen: string, depth = 15, skillLevel = 20) => {
    const w = workerRef.current
    if (!w) return
    setAnalysis(null)
    w.postMessage(`setoption name Skill Level value ${skillLevel}`)
    w.postMessage(`position fen ${fen}`)
    w.postMessage(`go depth ${depth}`)
  }, [])

  return { analysis, analyze }
}
```

- [ ] **Step 5: Run — verify pass**

```bash
cd frontend && npm test -- useStockfish
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/workers/ frontend/src/hooks/useStockfish.ts frontend/src/hooks/useStockfish.test.ts
git commit -m "feat: add useStockfish hook with Web Worker"
```

---

### Task 12: useMoveHints hook

**Files:**
- Create: `frontend/src/hooks/useMoveHints.ts`
- Create: `frontend/src/hooks/useMoveHints.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useMoveHints.test.ts
import { renderHook, act } from '@testing-library/react'
import { useMoveHints } from './useMoveHints'

test('defaults to true', () => {
  const { result } = renderHook(() => useMoveHints())
  expect(result.current.hintsEnabled).toBe(true)
})

test('toggle flips the value', () => {
  const { result } = renderHook(() => useMoveHints())
  act(() => result.current.toggle())
  expect(result.current.hintsEnabled).toBe(false)
  act(() => result.current.toggle())
  expect(result.current.hintsEnabled).toBe(true)
})

test('persists to localStorage', () => {
  const { result } = renderHook(() => useMoveHints())
  act(() => result.current.toggle())
  expect(localStorage.getItem('chess-move-hints')).toBe('false')
})

test('reads initial value from localStorage', () => {
  localStorage.setItem('chess-move-hints', 'false')
  const { result } = renderHook(() => useMoveHints())
  expect(result.current.hintsEnabled).toBe(false)
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useMoveHints
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useMoveHints.ts
import { useState, useCallback } from 'react'

const KEY = 'chess-move-hints'

export function useMoveHints() {
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(KEY)
    return stored === null ? true : stored === 'true'
  })

  const toggle = useCallback(() => {
    setHintsEnabled(prev => {
      const next = !prev
      localStorage.setItem(KEY, String(next))
      return next
    })
  }, [])

  return { hintsEnabled, toggle }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useMoveHints
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useMoveHints.ts frontend/src/hooks/useMoveHints.test.ts
git commit -m "feat: add useMoveHints hook with localStorage persistence"
```

---

### Task 13: GamePage

**Files:**
- Create: `frontend/src/components/Game/GamePage.tsx`
- Create: `frontend/src/components/Game/GamePage.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/components/Game/GamePage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import GamePage from './GamePage'
import type { UserProfile } from '../../types'

vi.mock('react-chessboard', () => ({
  Chessboard: ({ onSquareClick }: { onSquareClick: (sq: string) => void }) => (
    <div data-testid="chess-board" onClick={() => onSquareClick('e2')} />
  ),
}))
vi.mock('../../hooks/useStockfish', () => ({
  useStockfish: () => ({ analysis: null, analyze: vi.fn() }),
}))
vi.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({ speak: vi.fn(), listening: false, startListening: vi.fn(), transcript: '' }),
}))
vi.mock('../../services/coachApi', () => ({
  fetchCoachResponse: vi.fn().mockResolvedValue('Good move!'),
}))
vi.mock('../Coach/CoachPanel', () => ({
  default: () => <div>Magnus</div>,
}))

const mockProfile: UserProfile = {
  uid: 'u1', name: 'Alex', track: 'adventurer', skillLevel: 5,
  miniBoardStage: 5, winsAtCurrentStage: 0, currentLesson: 'rook',
  piecesUnlocked: [], puzzlesSolved: 0, gamesPlayed: 0,
}

test('renders chess board and coach panel', () => {
  render(<GamePage profile={mockProfile} onGameSaved={vi.fn()} />)
  expect(screen.getByTestId('chess-board')).toBeInTheDocument()
  expect(screen.getByText(/magnus/i)).toBeInTheDocument()
})

test('hint toggle button is present', () => {
  render(<GamePage profile={mockProfile} onGameSaved={vi.fn()} />)
  expect(screen.getByTitle(/hints/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- GamePage
```

- [ ] **Step 3: Implement GamePage**

```typescript
// frontend/src/components/Game/GamePage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Square } from 'chess.js'
import { useChessGame } from '../../hooks/useChessGame'
import { useStockfish } from '../../hooks/useStockfish'
import { useMoveHints } from '../../hooks/useMoveHints'
import { useVoice } from '../../hooks/useVoice'
import { fetchCoachResponse } from '../../services/coachApi'
import ChessBoard from '../Board/ChessBoard'
import CoachPanel from '../Coach/CoachPanel'
import type { UserProfile, CoachMessage } from '../../types'

interface Props {
  profile: UserProfile
  onGameSaved: () => void
}

export default function GamePage({ profile, onGameSaved }: Props) {
  const game = useChessGame()
  const { analysis, analyze } = useStockfish()
  const { hintsEnabled, toggle: toggleHints } = useMoveHints()
  const { speak } = useVoice()

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([])
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [prevEval, setPrevEval] = useState<number>(0)

  // Run Stockfish after player (white) moves — Stockfish plays as Black
  useEffect(() => {
    if (game.turn === 'b' && !game.isGameOver) {
      analyze(game.fen, 15, profile.skillLevel)
    }
  }, [game.fen])

  // Play Stockfish's best move as Black, then detect blunder and request coach
  useEffect(() => {
    if (!analysis) return

    // Play AI move if it's still Black's turn
    if (game.turn === 'b' && !game.isGameOver) {
      const from = analysis.bestMove.slice(0, 2) as Square
      const to = analysis.bestMove.slice(2, 4) as Square
      game.makeMove(from, to)
    }

    // Blunder detection (drop from white's perspective after white's last move)
    const drop = prevEval - analysis.evaluation
    const isBlunder = drop > 200
    setPrevEval(analysis.evaluation)

    fetchCoachResponse({
      fen: game.fen,
      lastMove: game.lastMove ?? '',
      evaluation: analysis.evaluation / 100,
      bestMove: analysis.bestMove,
      lessonTopic: profile.currentLesson,
      track: profile.track,
      history: messages,
      userMessage: isBlunder ? 'I just made a move' : '',
    }).then(msg => {
      const coachMsg: CoachMessage = { role: 'coach', text: msg }
      setMessages(prev => [...prev, coachMsg])
      speak(msg)
    })
  }, [analysis])

  const onSquareClick = useCallback((square: Square) => {
    if (highlightedSquares.includes(square)) {
      game.makeMove(selectedSquare!, square)
      setSelectedSquare(null)
      setHighlightedSquares([])
      return
    }
    const moves = game.getLegalMoves(square)
    if (moves.length > 0) {
      setSelectedSquare(square)
      setHighlightedSquares(hintsEnabled ? moves : [])
    } else {
      setSelectedSquare(null)
      setHighlightedSquares([])
    }
  }, [highlightedSquares, selectedSquare, game, hintsEnabled])

  async function sendUserMessage(text: string) {
    const userMsg: CoachMessage = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    const reply = await fetchCoachResponse({
      fen: game.fen,
      lastMove: game.lastMove ?? '',
      evaluation: (analysis?.evaluation ?? 0) / 100,
      bestMove: analysis?.bestMove ?? '',
      lessonTopic: profile.currentLesson,
      track: profile.track,
      history: [...messages, userMsg],
      userMessage: text,
    })
    const coachMsg: CoachMessage = { role: 'coach', text: reply }
    setMessages(prev => [...prev, coachMsg])
    speak(reply)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px' }}>
        <button
          title="Toggle hints"
          onClick={toggleHints}
          style={{ background: 'none', border: '1px solid #ffd200', borderRadius: 6, color: '#ffd200', padding: '4px 10px', cursor: 'pointer', fontSize: 18 }}
        >
          💡
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <ChessBoard
          fen={game.fen}
          onSquareClick={onSquareClick}
          highlightedSquares={highlightedSquares}
        />
      </div>
      <CoachPanel messages={messages} onSendMessage={sendUserMessage} />
    </div>
  )
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- GamePage
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Game/
git commit -m "feat: add GamePage with chess, Stockfish, hints, and coach integration"
```

---

## Chunk 3: Mini-boards, Voice, Coach Panel, coachApi

### Task 14: MiniChess engine + stageConfigs

**Files:**
- Create: `frontend/src/engine/stageConfigs.ts`
- Create: `frontend/src/engine/MiniChess.ts`
- Create: `frontend/src/engine/MiniChess.test.ts`

- [ ] **Step 1: Create stageConfigs**

```typescript
// frontend/src/engine/stageConfigs.ts
import type { StageConfig } from '../types'

export const STAGE_CONFIGS: StageConfig[] = [
  { stage: 1, rows: 3, cols: 3, pieces: ['k', 'r'] },
  { stage: 2, rows: 4, cols: 4, pieces: ['k', 'r', 'b'] },
  { stage: 3, rows: 6, cols: 6, pieces: ['k', 'q', 'r', 'b', 'p'] },
  { stage: 4, rows: 6, cols: 6, pieces: ['k', 'q', 'r', 'b', 'n', 'p'] },
]
```

- [ ] **Step 2: Write failing tests for MiniChess**

```typescript
// frontend/src/engine/MiniChess.test.ts
import { MiniChess } from './MiniChess'
import { STAGE_CONFIGS } from './stageConfigs'

test('stage 1: board initializes with king and rook', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  const pieces = game.getBoard().flat().filter(Boolean)
  expect(pieces.some(p => p?.toLowerCase() === 'k')).toBe(true)
  expect(pieces.some(p => p?.toLowerCase() === 'r')).toBe(true)
})

test('stage 1: rook can move horizontally', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  // place rook at a1 (row 2, col 0), move to a3 (row 0, col 0)
  game.setBoardForTest([
    [null, null, 'K'],
    [null, null, null],
    ['R', null, 'k'],
  ])
  const moves = game.getLegalMoves(2, 0)
  expect(moves.some(([r, c]) => r === 1 && c === 0)).toBe(true)
})

test('isGameOver returns true when king is captured', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  game.setBoardForTest([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ])
  expect(game.isGameOver()).toBe(true)
})

test('currentPlayer alternates after move', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  expect(game.currentPlayer).toBe('w')
  game.makeMove(0, 0, 0, 1) // some legal move
  expect(game.currentPlayer).toBe('b')
})
```

- [ ] **Step 3: Run — verify fail**

```bash
cd frontend && npm test -- MiniChess
```

- [ ] **Step 4: Implement MiniChess**

```typescript
// frontend/src/engine/MiniChess.ts
import type { StageConfig, MiniChessState } from '../types'

type Piece = string | null

export class MiniChess {
  private board: Piece[][]
  currentPlayer: 'w' | 'b' = 'w'
  private config: StageConfig

  constructor(config: StageConfig) {
    this.config = config
    this.board = this.initBoard(config)
  }

  private initBoard(config: StageConfig): Piece[][] {
    const { rows, cols } = config
    const b: Piece[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    // White pieces top row, black pieces bottom row (simplified placement)
    if (config.pieces.includes('k')) {
      b[0][cols - 1] = 'K'      // white king top-right
      b[rows - 1][0] = 'k'     // black king bottom-left
    }
    if (config.pieces.includes('r')) {
      b[0][0] = 'R'             // white rook top-left
    }
    if (config.pieces.includes('b') && cols >= 4) {
      b[0][1] = 'B'
    }
    if (config.pieces.includes('q') && cols >= 6) {
      b[0][2] = 'Q'
    }
    return b
  }

  setBoardForTest(board: Piece[][]) {
    this.board = board
  }

  getBoard(): Piece[][] {
    return this.board.map(r => [...r])
  }

  getLegalMoves(row: number, col: number): [number, number][] {
    const piece = this.board[row][col]
    if (!piece) return []
    const isWhite = piece === piece.toUpperCase()
    if ((isWhite && this.currentPlayer !== 'w') || (!isWhite && this.currentPlayer !== 'b')) return []

    const moves: [number, number][] = []
    const type = piece.toLowerCase()
    const { rows, cols } = this.config

    const addIfValid = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false
      const target = this.board[r][c]
      if (target) {
        const targetIsWhite = target === target.toUpperCase()
        if (isWhite !== targetIsWhite) moves.push([r, c]) // capture enemy
        return false // stop sliding
      }
      moves.push([r, c])
      return true
    }

    const slide = (dr: number, dc: number) => {
      let r = row + dr, c = col + dc
      while (addIfValid(r, c)) { r += dr; c += dc }
    }

    if (type === 'r') { slide(1,0); slide(-1,0); slide(0,1); slide(0,-1) }
    if (type === 'b') { slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1) }
    if (type === 'q') { slide(1,0); slide(-1,0); slide(0,1); slide(0,-1); slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1) }
    if (type === 'k') {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) addIfValid(row+dr, col+dc)
    }
    if (type === 'n') {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) addIfValid(row+dr, col+dc)
    }
    if (type === 'p') {
      const dir = isWhite ? -1 : 1
      addIfValid(row + dir, col)
    }

    return moves
  }

  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const legal = this.getLegalMoves(fromRow, fromCol)
    if (!legal.some(([r, c]) => r === toRow && c === toCol)) return false
    this.board[toRow][toCol] = this.board[fromRow][fromCol]
    this.board[fromRow][fromCol] = null
    this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w'
    return true
  }

  isGameOver(): boolean {
    const pieces = this.board.flat().filter(Boolean)
    const hasWhiteKing = pieces.some(p => p === 'K')
    const hasBlackKing = pieces.some(p => p === 'k')
    return !hasWhiteKing || !hasBlackKing
  }

  winner(): 'w' | 'b' | null {
    if (!this.isGameOver()) return null
    const pieces = this.board.flat().filter(Boolean)
    return pieces.some(p => p === 'K') ? 'w' : 'b'
  }

  toFenLike(): string {
    return this.board.map(row => row.map(p => p ?? '.').join('')).join('/')
  }
}
```

- [ ] **Step 5: Run — verify pass**

```bash
cd frontend && npm test -- MiniChess
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/engine/
git commit -m "feat: add MiniChess custom engine and stage configs"
```

---

### Task 15: useMiniChess hook

**Files:**
- Create: `frontend/src/hooks/useMiniChess.ts`
- Create: `frontend/src/hooks/useMiniChess.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useMiniChess.test.ts
import { renderHook, act } from '@testing-library/react'
import { useMiniChess } from './useMiniChess'

test('initializes at stage 1', () => {
  const { result } = renderHook(() => useMiniChess(1))
  expect(result.current.stage).toBe(1)
})

test('isOver is false initially', () => {
  const { result } = renderHook(() => useMiniChess(1))
  expect(result.current.isOver).toBe(false)
})

test('winsAtStage starts at 0', () => {
  const { result } = renderHook(() => useMiniChess(1))
  expect(result.current.winsAtStage).toBe(0)
})

test('advanceStage increments stage', () => {
  const { result } = renderHook(() => useMiniChess(1))
  act(() => result.current.advanceStage())
  expect(result.current.stage).toBe(2)
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useMiniChess
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useMiniChess.ts
import { useState, useCallback, useRef } from 'react'
import { MiniChess } from '../engine/MiniChess'
import { STAGE_CONFIGS } from '../engine/stageConfigs'

export function useMiniChess(initialStage: number) {
  const [stage, setStage] = useState(initialStage)
  const [winsAtStage, setWinsAtStage] = useState(0)
  const [isOver, setIsOver] = useState(false)
  const [winner, setWinner] = useState<'w' | 'b' | null>(null)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<[number, number][]>([])

  const gameRef = useRef(new MiniChess(STAGE_CONFIGS[initialStage - 1]))
  const [board, setBoard] = useState(gameRef.current.getBoard())

  const refreshBoard = () => setBoard(gameRef.current.getBoard())

  const selectCell = useCallback((row: number, col: number) => {
    const game = gameRef.current
    if (isOver) return

    // If clicking a highlighted cell, execute move
    if (highlightedCells.some(([r, c]) => r === row && c === col)) {
      game.makeMove(selectedCell![0], selectedCell![1], row, col)
      setSelectedCell(null)
      setHighlightedCells([])
      refreshBoard()
      if (game.isGameOver()) {
        const w = game.winner()
        setIsOver(true)
        setWinner(w)
        if (w === 'w') setWinsAtStage(n => n + 1)
      }
      return
    }

    const moves = game.getLegalMoves(row, col)
    if (moves.length > 0) {
      setSelectedCell([row, col])
      setHighlightedCells(moves)
    } else {
      setSelectedCell(null)
      setHighlightedCells([])
    }
  }, [isOver, highlightedCells, selectedCell])

  const advanceStage = useCallback(() => {
    const next = Math.min(stage + 1, 4)
    setStage(next)
    setWinsAtStage(0)  // reset win count for the new stage
    gameRef.current = new MiniChess(STAGE_CONFIGS[next - 1])
    refreshBoard()
    setIsOver(false)
    setWinner(null)
    setSelectedCell(null)
    setHighlightedCells([])
  }, [stage])

  const resetGame = useCallback(() => {
    gameRef.current = new MiniChess(STAGE_CONFIGS[stage - 1])
    refreshBoard()
    setIsOver(false)
    setWinner(null)
    setSelectedCell(null)
    setHighlightedCells([])
  }, [stage])

  return {
    stage, board, isOver, winner, winsAtStage,
    selectedCell, highlightedCells,
    selectCell, advanceStage, resetGame,
    config: STAGE_CONFIGS[stage - 1],
    fenLike: gameRef.current.toFenLike(),
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useMiniChess
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useMiniChess.ts frontend/src/hooks/useMiniChess.test.ts
git commit -m "feat: add useMiniChess hook"
```

---

### Task 16: MiniStage component

**Files:**
- Create: `frontend/src/components/MiniBoard/MiniStage.tsx`
- Create: `frontend/src/components/MiniBoard/MiniStage.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/components/MiniBoard/MiniStage.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import MiniStage from './MiniStage'
import type { UserProfile } from '../../types'

vi.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({ speak: vi.fn(), listening: false, startListening: vi.fn(), transcript: '' }),
}))
vi.mock('../../services/coachApi', () => ({
  fetchCoachResponse: vi.fn().mockResolvedValue('Well done!'),
}))

const profile: UserProfile = {
  uid: 'u1', name: 'Alex', track: 'explorer', skillLevel: 5,
  miniBoardStage: 1, winsAtCurrentStage: 0, currentLesson: 'rook',
  piecesUnlocked: [], puzzlesSolved: 0, gamesPlayed: 0,
}

test('renders stage 1 board', () => {
  render(<MiniStage profile={profile} onGraduate={vi.fn()} />)
  expect(screen.getByText(/stage 1/i)).toBeInTheDocument()
})

test('renders coach panel', () => {
  render(<MiniStage profile={profile} onGraduate={vi.fn()} />)
  expect(screen.getByText(/magnus/i)).toBeInTheDocument()
})

test('renders all 4 stages when stage advances', () => {
  const { rerender } = render(<MiniStage profile={profile} onGraduate={vi.fn()} />)
  expect(screen.getByText(/stage 1/i)).toBeInTheDocument()
  rerender(<MiniStage profile={{ ...profile, miniBoardStage: 3 }} onGraduate={vi.fn()} />)
  expect(screen.getByText(/stage 3/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- MiniStage
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/components/MiniBoard/MiniStage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useMiniChess } from '../../hooks/useMiniChess'
import { fetchCoachResponse } from '../../services/coachApi'
import CoachPanel from '../Coach/CoachPanel'
import type { UserProfile, CoachMessage } from '../../types'

interface Props {
  profile: UserProfile
  onGraduate: () => void
}

const WINS_TO_ADVANCE = 3

export default function MiniStage({ profile, onGraduate }: Props) {
  const mini = useMiniChess(profile.miniBoardStage)
  const [messages, setMessages] = useState<CoachMessage[]>([])

  // CoachPanel owns useVoice internally — MiniStage does not call useVoice directly
  // to avoid two concurrent SpeechSynthesis instances

  useEffect(() => {
    if (mini.isOver && mini.winner === 'w') {
      if (mini.winsAtStage >= WINS_TO_ADVANCE) {
        if (mini.stage >= 4) {
          onGraduate()
        } else {
          mini.advanceStage()
        }
      } else {
        mini.resetGame()
      }
    }
  }, [mini.isOver, mini.winner, mini.winsAtStage, mini.stage, mini.advanceStage, mini.resetGame, onGraduate])

  const sendUserMessage = useCallback(async (text: string) => {
    const userMsg: CoachMessage = { role: 'user', text }
    setMessages(prev => {
      const updated = [...prev, userMsg]
      fetchCoachResponse({
        fen: mini.fenLike,
        lastMove: '',
        evaluation: 0,
        bestMove: '',
        lessonTopic: profile.currentLesson,
        track: profile.track,
        history: updated,
        userMessage: text,
      }).then(reply => {
        setMessages(m => [...m, { role: 'coach', text: reply }])
      })
      return updated
    })
  }, [mini.fenLike, profile.currentLesson, profile.track])

  const { rows, cols } = mini.config
  const cellSize = Math.min(60, Math.floor(320 / Math.max(rows, cols)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ textAlign: 'center', padding: '12px', color: '#ffd200', fontFamily: 'sans-serif' }}>
        Stage {mini.stage} — Wins: {mini.winsAtStage}/{WINS_TO_ADVANCE}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 2 }}>
          {mini.board.map((row, r) =>
            row.map((piece, c) => {
              const isSelected = mini.selectedCell?.[0] === r && mini.selectedCell?.[1] === c
              const isHighlighted = mini.highlightedCells.some(([hr, hc]) => hr === r && hc === c)
              const isLight = (r + c) % 2 === 0
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => mini.selectCell(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isSelected ? '#ffd200' : isHighlighted ? 'rgba(0,200,100,0.5)' : isLight ? '#f0d9b5' : '#b58863',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize * 0.6, cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {piece && pieceEmoji(piece)}
                </div>
              )
            })
          )}
        </div>
      </div>
      <CoachPanel messages={messages} onSendMessage={sendUserMessage} />
    </div>
  )
}

function pieceEmoji(piece: string): string {
  const map: Record<string, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  }
  return map[piece] ?? piece
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- MiniStage
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MiniBoard/
git commit -m "feat: add MiniStage component with 4-stage progression"
```

---

### Task 17: useVoice hook

**Files:**
- Create: `frontend/src/hooks/useVoice.ts`
- Create: `frontend/src/hooks/useVoice.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/hooks/useVoice.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

const mockSpeak = vi.fn()
const mockRecognitionStart = vi.fn()

vi.stubGlobal('speechSynthesis', { speak: mockSpeak, cancel: vi.fn() })
vi.stubGlobal('SpeechSynthesisUtterance', vi.fn().mockImplementation((text: string) => ({ text })))
vi.stubGlobal('webkitSpeechRecognition', vi.fn().mockImplementation(() => ({
  start: mockRecognitionStart,
  stop: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
  continuous: false,
  interimResults: false,
  lang: '',
})))

import { useVoice } from './useVoice'

test('speak calls speechSynthesis.speak', () => {
  const { result } = renderHook(() => useVoice())
  act(() => result.current.speak('Hello'))
  expect(mockSpeak).toHaveBeenCalled()
})

test('startListening calls recognition.start', () => {
  const { result } = renderHook(() => useVoice())
  act(() => result.current.startListening())
  expect(mockRecognitionStart).toHaveBeenCalled()
})

test('listening starts false', () => {
  const { result } = renderHook(() => useVoice())
  expect(result.current.listening).toBe(false)
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- useVoice
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/hooks/useVoice.ts
import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.9
    utt.pitch = 1.1
    window.speechSynthesis.speak(utt)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? (window as Record<string, unknown>)['webkitSpeechRecognition'] as typeof SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      setTranscript(e.results[0][0].transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { speak, startListening, stopListening, listening, transcript }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- useVoice
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useVoice.ts frontend/src/hooks/useVoice.test.ts
git commit -m "feat: add useVoice hook (Web Speech API)"
```

---

### Task 18: CoachPanel component

**Files:**
- Create: `frontend/src/components/Coach/CoachPanel.tsx`
- Create: `frontend/src/components/Coach/CoachPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/components/Coach/CoachPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import CoachPanel from './CoachPanel'

const mockStartListening = vi.fn()
const mockStopListening = vi.fn()

vi.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({
    speak: vi.fn(),
    listening: false,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    transcript: '',
  }),
}))

test('renders Magnus name', () => {
  render(<CoachPanel messages={[]} onSendMessage={vi.fn()} />)
  expect(screen.getByText(/magnus/i)).toBeInTheDocument()
})

test('renders coach messages', () => {
  const msgs = [{ role: 'coach' as const, text: 'Nice move!' }]
  render(<CoachPanel messages={msgs} onSendMessage={vi.fn()} />)
  expect(screen.getByText('Nice move!')).toBeInTheDocument()
})

test('mic button triggers startListening', () => {
  render(<CoachPanel messages={[]} onSendMessage={vi.fn()} />)
  fireEvent.click(screen.getByTitle(/speak/i))
  expect(mockStartListening).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- CoachPanel
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/components/Coach/CoachPanel.tsx
import { useEffect } from 'react'
import { useVoice } from '../../hooks/useVoice'
import type { CoachMessage } from '../../types'

interface Props {
  messages: CoachMessage[]
  onSendMessage: (text: string) => void
}

export default function CoachPanel({ messages, onSendMessage }: Props) {
  const { speak, startListening, stopListening, listening, transcript } = useVoice()

  useEffect(() => {
    if (transcript) onSendMessage(transcript)
  }, [transcript, onSendMessage])

  const lastCoachMsg = [...messages].reverse().find(m => m.role === 'coach')

  return (
    <div style={{
      background: '#0a1628', borderTop: '1px solid #1e3a5f',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 32 }}>🧙</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#ffd200', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
          Magnus
        </div>
        <div style={{ color: '#7eb8f7', fontFamily: 'sans-serif', fontSize: 14, minHeight: 20 }}>
          {lastCoachMsg?.text ?? 'Ready to play!'}
        </div>
      </div>
      <button
        title="Speak to Magnus"
        onClick={listening ? stopListening : startListening}
        style={{
          background: listening ? '#ffd200' : 'transparent',
          border: '2px solid #ffd200', borderRadius: '50%',
          width: 44, height: 44, fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        🎤
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- CoachPanel
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Coach/
git commit -m "feat: add CoachPanel with voice and Night Wizard theme"
```

---

### Task 19: coachApi service

**Files:**
- Create: `frontend/src/services/coachApi.ts`
- Create: `frontend/src/services/coachApi.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/services/coachApi.test.ts
import { vi } from 'vitest'
import { fetchCoachResponse } from './coachApi'
import type { CoachRequest } from '../types'

global.fetch = vi.fn()

const req: CoachRequest = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  lastMove: 'e2e4', evaluation: 0.3, bestMove: 'd7d5',
  lessonTopic: 'rook', track: 'adventurer', history: [],
  userMessage: 'I moved my pawn',
}

test('sends POST with correct shape', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true, json: async () => ({ message: 'Good move!' }),
  } as Response)
  await fetchCoachResponse(req)
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/coach/respond'),
    expect.objectContaining({ method: 'POST' })
  )
})

test('returns message string', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true, json: async () => ({ message: 'Good move!' }),
  } as Response)
  const result = await fetchCoachResponse(req)
  expect(result).toBe('Good move!')
})

test('throws on non-ok response', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)
  await expect(fetchCoachResponse(req)).rejects.toThrow()
})
```

- [ ] **Step 2: Run — verify fail**

```bash
cd frontend && npm test -- coachApi
```

- [ ] **Step 3: Implement**

```typescript
// frontend/src/services/coachApi.ts
import type { CoachRequest } from '../types'

// Note: Vite requires the VITE_ prefix for env vars exposed to the browser.
// The spec refers to this as COACH_API_URL but the actual env var is VITE_COACH_API_URL.
const API_URL = import.meta.env.VITE_COACH_API_URL ?? 'http://localhost:8000'

export async function fetchCoachResponse(req: CoachRequest): Promise<string> {
  const res = await fetch(`${API_URL}/coach/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`Coach API error: ${res.status}`)
  const data = await res.json()
  return data.message as string
}
```

- [ ] **Step 4: Run — verify pass**

```bash
cd frontend && npm test -- coachApi
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/coachApi.ts frontend/src/services/coachApi.test.ts
git commit -m "feat: add coachApi service (POST /coach/respond)"
```

---

## Chunk 4: Backend, Routing, and Deployment

### Task 20: FastAPI backend

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/main.py`
- Create: `backend/models/schemas.py`
- Create: `backend/services/gemma.py`
- Create: `backend/routers/coach.py`
- Create: `backend/tests/test_coach.py`

- [ ] **Step 1: Initialize backend with uv**

```bash
cd backend
uv init --no-workspace
uv add fastapi uvicorn httpx python-dotenv
uv add --dev pytest pytest-asyncio httpx
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/models/schemas.py
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
```

- [ ] **Step 3: Write failing test for coach endpoint**

```python
# backend/tests/test_coach.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
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
    # Test the prompt builder directly — no need to call the endpoint
    assert "Socratic" in SYSTEM_PROMPTS["adventurer"]
    assert "train" in SYSTEM_PROMPTS["explorer"]
    assert "evaluation" in SYSTEM_PROMPTS["champion"].lower() or "technical" in SYSTEM_PROMPTS["champion"].lower()

def test_system_prompts_all_forbid_giving_answer():
    for track, prompt in SYSTEM_PROMPTS.items():
        assert "never" in prompt.lower() or "not" in prompt.lower(), \
            f"Track '{track}' system prompt does not mention withholding answers"
```

- [ ] **Step 4: Run — verify fail**

```bash
cd backend && uv run pytest tests/test_coach.py -v
```

Expected: FAIL — module not found.

- [ ] **Step 5: Implement gemma service**

```python
# backend/services/gemma.py
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
```

- [ ] **Step 6: Implement coach router**

```python
# backend/routers/coach.py
from fastapi import APIRouter
from models.schemas import CoachRequest, CoachResponse
from services.gemma import get_coach_response

router = APIRouter()

@router.post("/coach/respond", response_model=CoachResponse)
async def coach_respond(req: CoachRequest) -> CoachResponse:
    message = await get_coach_response(req)
    return CoachResponse(message=message)
```

- [ ] **Step 7: Implement main FastAPI app**

```python
# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.coach import router

app = FastAPI(title="Chess Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
```

- [ ] **Step 8: Run tests — verify pass**

```bash
cd backend && uv run pytest tests/test_coach.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 9: Verify server starts**

```bash
cd backend && GEMMA_API_KEY=test uv run uvicorn main:app --reload
```

Expected: server running at http://localhost:8000

- [ ] **Step 10: Commit**

```bash
cd ..
git add backend/
git commit -m "feat: add FastAPI backend with Gemma 3 coach endpoint"
```

---

### Task 21: App routing + App.tsx

**Files:**
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Implement App.tsx with routing**

```typescript
// frontend/src/App.tsx
import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './services/firebase'
import { loadUserProfile, saveUserProfile } from './hooks/useFirestore'
import LoginPage from './components/Login/LoginPage'
import Onboarding from './components/Onboarding/Onboarding'
import MiniStage from './components/MiniBoard/MiniStage'
import GamePage from './components/Game/GamePage'
import type { UserProfile, Track } from './types'

type AppState = 'loading' | 'login' | 'onboarding' | 'mini' | 'game'

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { setAppState('login'); return }
      setUser(u)
      const existing = await loadUserProfile(u.uid)
      if (!existing) {
        setAppState('onboarding')
      } else {
        const p: UserProfile = { uid: u.uid, ...existing } as UserProfile
        setProfile(p)
        setAppState(p.miniBoardStage < 5 && p.track === 'explorer' ? 'mini' : 'game')
      }
    })
  }, [])

  async function handleOnboardingComplete({ name, track }: { name: string; track: Track }) {
    const p: UserProfile = {
      uid: user!.uid, name, track, skillLevel: 5, miniBoardStage: 1,
      winsAtCurrentStage: 0, currentLesson: 'rook',
      piecesUnlocked: [], puzzlesSolved: 0, gamesPlayed: 0,
    }
    await saveUserProfile(p)
    setProfile(p)
    setAppState(track === 'explorer' ? 'mini' : 'game')
  }

  function handleGraduate() {
    if (!profile) return
    const updated = { ...profile, miniBoardStage: 5 }
    setProfile(updated)
    saveUserProfile(updated)
    setAppState('game')
  }

  if (appState === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f1923', color: '#ffd200', fontFamily: 'sans-serif', fontSize: 24 }}>
      ♟ Loading...
    </div>
  )
  // onLogin is a no-op: onAuthStateChanged fires automatically after Google Sign-In
  // and handles the state transition — LoginPage's onLogin prop is intentionally empty here
  if (appState === 'login') return <LoginPage onLogin={() => {}} />
  if (appState === 'onboarding') return <Onboarding onComplete={handleOnboardingComplete} />
  if (appState === 'mini' && profile) return <MiniStage profile={profile} onGraduate={handleGraduate} />
  if (appState === 'game' && profile) return <GamePage profile={profile} onGameSaved={() => {}} />
  return null
}
```

- [ ] **Step 2: Update main.tsx**

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Run all tests**

```bash
cd frontend && npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add app routing (Login → Onboarding → MiniStage/GamePage)"
```

---

### Task 22: Deployment config

**Files:**
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create firebase.json**

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

- [ ] **Step 2: Create .firebaserc**

Find your Firebase project ID in the Firebase console (Project settings → General → Project ID). Then create the file:

```json
{
  "projects": {
    "default": "<your-firebase-project-id>"
  }
}
```

Replace `<your-firebase-project-id>` with the real value before proceeding. Do not commit this file until the placeholder is replaced.

- [ ] **Step 3: Create Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install uv && uv sync
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

- [ ] **Step 4: Build frontend for production**

```bash
cd frontend && npm run build
```

Expected: `frontend/dist/` created with no errors.

- [ ] **Step 5: Collect deployment values**

Before deploying, gather:
- `GEMMA_API_KEY`: from Google AI Studio → API keys
- Firebase project ID and hosting domain: from Firebase console → Hosting (e.g. `your-project.web.app`)

- [ ] **Step 6: Deploy backend to Cloud Run**

```bash
cd backend
gcloud run deploy chess-tutor-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMMA_API_KEY=YOUR_GEMMA_KEY,ALLOWED_ORIGINS=https://YOUR_PROJECT.web.app"
```

Note the deployed URL printed after success (e.g. `https://chess-tutor-api-xxxx-uc.a.run.app`).

Smoke-test the live endpoint:
```bash
curl -X POST https://chess-tutor-api-xxxx-uc.a.run.app/coach/respond \
  -H "Content-Type: application/json" \
  -d '{"fen":"start","lastMove":"e2e4","evaluation":0.3,"bestMove":"d7d5","lessonTopic":"rook","track":"adventurer","history":[],"userMessage":"hello"}'
```

Expected: `{"message": "..."}` with a coach response.

- [ ] **Step 7: Update frontend env and rebuild**

Create `frontend/.env.production`:
```
VITE_COACH_API_URL=https://chess-tutor-api-xxxx-uc.a.run.app
```

Build for production:
```bash
cd frontend && npm run build
```

Expected: `frontend/dist/` created with no errors.

- [ ] **Step 8: Deploy frontend to Firebase Hosting**

```bash
firebase deploy --only hosting
```

Verify the deploy: open `https://YOUR_PROJECT.web.app` in a browser and confirm the login page loads.

- [ ] **Step 9: Update status.json with final state**

```json
{
  "last_updated": "2026-03-10",
  "session_summary": "Full app deployed: Firebase Hosting (frontend) + Cloud Run (backend). All 21 build steps complete and tested.",
  "features": [
    { "id": "scaffold", "name": "Frontend scaffold + Vitest", "status": "tested" },
    { "id": "types", "name": "Shared TypeScript types", "status": "tested" },
    { "id": "firebase", "name": "Firebase service init", "status": "tested" },
    { "id": "login", "name": "LoginPage (Google Sign-In)", "status": "tested" },
    { "id": "onboarding", "name": "Onboarding component + useOnboarding", "status": "tested" },
    { "id": "firestore", "name": "useFirestore hook", "status": "tested" },
    { "id": "chess-board", "name": "ChessBoard component", "status": "tested" },
    { "id": "use-chess-game", "name": "useChessGame hook", "status": "tested" },
    { "id": "use-stockfish", "name": "useStockfish hook", "status": "tested" },
    { "id": "use-move-hints", "name": "useMoveHints hook", "status": "tested" },
    { "id": "game-page", "name": "GamePage", "status": "tested" },
    { "id": "mini-chess-engine", "name": "MiniChess.ts + stageConfigs", "status": "tested" },
    { "id": "use-mini-chess", "name": "useMiniChess hook", "status": "tested" },
    { "id": "mini-stage", "name": "MiniStage component", "status": "tested" },
    { "id": "use-voice", "name": "useVoice hook", "status": "tested" },
    { "id": "coach-panel", "name": "CoachPanel component", "status": "tested" },
    { "id": "coach-api", "name": "coachApi.ts service", "status": "tested" },
    { "id": "backend", "name": "FastAPI backend", "status": "tested" },
    { "id": "routing", "name": "App routing", "status": "tested" },
    { "id": "tests", "name": "Full test suite", "status": "tested" },
    { "id": "deploy", "name": "Deploy to Firebase + Cloud Run", "status": "tested" }
  ],
  "next_actions": ["Ship it!"]
}
```

- [ ] **Step 10: Final commit**

```bash
git add firebase.json .firebaserc backend/Dockerfile frontend/.env.production harness/status.json
git commit -m "feat: add deployment config (Firebase Hosting + Cloud Run)"
```
