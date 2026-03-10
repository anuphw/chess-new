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
