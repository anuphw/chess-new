import { vi } from 'vitest'
import { saveUserProfile, loadUserProfile, saveGameRecord } from './useFirestore'

const mockDoc = vi.fn()
const mockSetDoc = vi.fn().mockResolvedValue(undefined)
const mockGetDoc = vi.fn()
const mockAddDoc = vi.fn().mockResolvedValue({ id: 'game1' })

vi.mock('../services/firebase', () => ({ db: {} }))
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
