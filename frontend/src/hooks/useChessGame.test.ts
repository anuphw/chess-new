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
