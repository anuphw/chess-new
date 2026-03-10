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
