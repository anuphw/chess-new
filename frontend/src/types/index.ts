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
