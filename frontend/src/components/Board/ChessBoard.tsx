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
  const customSquareStyles = Object.fromEntries(
    highlightedSquares.map(sq => [sq, {
      background: 'radial-gradient(circle, rgba(0,200,100,0.6) 25%, transparent 25%)',
      borderRadius: '50%',
    }])
  )

  return (
    <Chessboard
      position={fen}
      onSquareClick={disabled ? undefined : onSquareClick}
      customSquareStyles={customSquareStyles}
      boardOrientation={boardOrientation}
    />
  )
}
