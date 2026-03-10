import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ChessBoard from './ChessBoard'

vi.mock('react-chessboard', () => ({
  Chessboard: ({ onSquareClick, customSquareStyles }: { onSquareClick: (sq: string) => void, customSquareStyles: Record<string, unknown> }) => (
    <div data-testid="chess-board" onClick={() => onSquareClick('e2')}>
      {Object.keys(customSquareStyles || {}).map(sq => (
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
