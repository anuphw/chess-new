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
