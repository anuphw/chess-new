import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LoginPage from './LoginPage'

vi.mock('../../services/firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({ user: { uid: '123' } }),
}))

test('renders sign-in button', () => {
  render(<LoginPage onLogin={vi.fn()} />)
  expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
})

test('calls onLogin after successful sign-in', async () => {
  const onLogin = vi.fn()
  render(<LoginPage onLogin={onLogin} />)
  fireEvent.click(screen.getByText(/sign in with google/i))
  await vi.waitFor(() => expect(onLogin).toHaveBeenCalled())
})
