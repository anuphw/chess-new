import { Chessboard } from 'react-chessboard'
import type { Square } from 'chess.js'

interface Props {
  fen: string
  onSquareClick: (square: Square) => void
  highlightedSquares: Square[]
  boardOrientation?: 'white' | 'black'
  disabled?: boolean
}

export default function ChessBoard({ fen, onSquareClick, highlightedSquares, boardOrientation = 'white', disabled = false }: Props) {
  const squareStyles = Object.fromEntries(
    highlightedSquares.map(sq => [sq, {
      background: 'radial-gradient(circle, rgba(0,200,100,0.6) 25%, transparent 25%)',
      borderRadius: '50%',
    }])
  )

  return (
    <Chessboard
      options={{
        position: fen,
        boardOrientation,
        squareStyles,
        allowDragging: false,
        onSquareClick: disabled ? undefined : ({ square }) => onSquareClick(square as Square),
      }}
    />
  )
}
