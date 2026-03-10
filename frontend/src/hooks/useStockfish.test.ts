import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// Mock the Web Worker as a proper constructor
const mockWorker = {
  postMessage: vi.fn(),
  onmessage: null as ((e: MessageEvent) => void) | null,
  terminate: vi.fn(),
}

class MockWorker {
  postMessage = mockWorker.postMessage
  terminate = mockWorker.terminate
  set onmessage(fn: ((e: MessageEvent) => void) | null) {
    mockWorker.onmessage = fn
  }
}

vi.stubGlobal('Worker', MockWorker)

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
