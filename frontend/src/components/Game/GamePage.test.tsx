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
  useVoice: () => ({ speak: vi.fn(), listening: false, startListening: vi.fn(), stopListening: vi.fn(), transcript: '' }),
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
