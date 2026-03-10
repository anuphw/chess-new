import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

const mockSpeak = vi.fn()
const mockRecognitionStart = vi.fn()

vi.stubGlobal('speechSynthesis', { speak: mockSpeak, cancel: vi.fn() })

class MockUtterance {
  text: string
  rate = 1
  pitch = 1
  constructor(text: string) { this.text = text }
}
vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

class MockRecognition {
  start = mockRecognitionStart
  stop = vi.fn()
  onresult: null = null
  onerror: null = null
  onend: null = null
  continuous = false
  interimResults = false
  lang = ''
}
vi.stubGlobal('webkitSpeechRecognition', MockRecognition)

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
