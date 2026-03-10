import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

export function useChessGame() {
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState(chess.fen())
  const [lastMove, setLastMove] = useState<string | null>(null)

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    try {
      const move = chess.move({ from, to, promotion: 'q' })
      if (!move) return false
      setFen(chess.fen())
      setLastMove(`${from}${to}`)
      return true
    } catch {
      return false
    }
  }, [chess])

  const getLegalMoves = useCallback((square: Square): Square[] => {
    return chess.moves({ square, verbose: true }).map(m => m.to as Square)
  }, [chess])

  const reset = useCallback(() => {
    chess.reset()
    setFen(chess.fen())
    setLastMove(null)
  }, [chess])

  return {
    fen,
    lastMove,
    isGameOver: chess.isGameOver(),
    isCheck: chess.inCheck(),
    turn: chess.turn(),
    makeMove,
    getLegalMoves,
    reset,
    pgn: () => chess.pgn(),
  }
}
