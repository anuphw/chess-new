import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import CoachPanel from './CoachPanel'

const mockStartListening = vi.fn()
const mockStopListening = vi.fn()

vi.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({
    speak: vi.fn(),
    listening: false,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    transcript: '',
  }),
}))

test('renders Magnus name', () => {
  render(<CoachPanel messages={[]} onSendMessage={vi.fn()} />)
  expect(screen.getByText(/magnus/i)).toBeInTheDocument()
})

test('renders coach messages', () => {
  const msgs = [{ role: 'coach' as const, text: 'Nice move!' }]
  render(<CoachPanel messages={msgs} onSendMessage={vi.fn()} />)
  expect(screen.getByText('Nice move!')).toBeInTheDocument()
})

test('mic button triggers startListening', () => {
  render(<CoachPanel messages={[]} onSendMessage={vi.fn()} />)
  fireEvent.click(screen.getByTitle(/speak/i))
  expect(mockStartListening).toHaveBeenCalled()
})
