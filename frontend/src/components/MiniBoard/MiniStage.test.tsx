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
