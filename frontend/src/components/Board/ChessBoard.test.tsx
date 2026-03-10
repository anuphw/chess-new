import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ChessBoard from './ChessBoard'

vi.mock('react-chessboard', () => ({
  Chessboard: ({ options }: { options?: { onSquareClick?: (args: { square: string }) => void; squareStyles?: Record<string, unknown> } }) => (
    <div data-testid="chess-board" onClick={() => options?.onSquareClick?.({ square: 'e2' })}>
      {Object.keys(options?.squareStyles || {}).map(sq => (
        <div key={sq} data-testid={`highlight-${sq}`} />
      ))}
    </div>
  ),
}))

test('renders chess board', () => {
  render(<ChessBoard fen="start" onSquareClick={vi.fn()} highlightedSquares={[]} />)
  expect(screen.getByTestId('chess-board')).toBeInTheDocument()
})

test('calls onSquareClick when board is clicked', () => {
  const onClick = vi.fn()
  render(<ChessBoard fen="start" onSquareClick={onClick} highlightedSquares={[]} />)
  fireEvent.click(screen.getByTestId('chess-board'))
  expect(onClick).toHaveBeenCalledWith('e2')
})

test('renders highlight squares', () => {
  render(<ChessBoard fen="start" onSquareClick={vi.fn()} highlightedSquares={['e4', 'e3']} />)
  expect(screen.getByTestId('highlight-e4')).toBeInTheDocument()
  expect(screen.getByTestId('highlight-e3')).toBeInTheDocument()
})
