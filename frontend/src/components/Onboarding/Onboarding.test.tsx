import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Onboarding from './Onboarding'

test('renders step 1 — experience question', () => {
  render(<Onboarding onComplete={vi.fn()} />)
  expect(screen.getByText(/have you played before/i)).toBeInTheDocument()
})

test('advances to step 2 after experience selection', () => {
  render(<Onboarding onComplete={vi.fn()} />)
  fireEvent.click(screen.getByText(/never/i))
  expect(screen.getByText(/how old are you/i)).toBeInTheDocument()
})

test('calls onComplete with name and track after all steps', async () => {
  const onComplete = vi.fn()
  render(<Onboarding onComplete={onComplete} />)
  fireEvent.click(screen.getByText(/never/i))
  fireEvent.click(screen.getByText(/next/i))
  fireEvent.click(screen.getByText(/^no$/i))
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Alex' } })
  fireEvent.click(screen.getByText(/let's go/i))
  expect(onComplete).toHaveBeenCalledWith({ name: 'Alex', track: 'explorer' })
})
