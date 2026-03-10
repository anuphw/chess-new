import { useState, useCallback, useRef, useEffect } from 'react'
import { MiniChess } from '../engine/MiniChess'
import { STAGE_CONFIGS } from '../engine/stageConfigs'

export function useMiniChess(initialStage: number) {
  const [stage, setStage] = useState(initialStage)
  const [winsAtStage, setWinsAtStage] = useState(0)
  const [isOver, setIsOver] = useState(false)
  const [winner, setWinner] = useState<'w' | 'b' | null>(null)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<[number, number][]>([])

  const gameRef = useRef(new MiniChess(STAGE_CONFIGS[initialStage - 1]))
  const [board, setBoard] = useState(gameRef.current.getBoard())

  const refreshBoard = () => setBoard(gameRef.current.getBoard())

  useEffect(() => {
    setStage(initialStage)
    setWinsAtStage(0)
    gameRef.current = new MiniChess(STAGE_CONFIGS[initialStage - 1])
    setBoard(gameRef.current.getBoard())
    setIsOver(false)
    setWinner(null)
    setSelectedCell(null)
    setHighlightedCells([])
  }, [initialStage])

  const selectCell = useCallback((row: number, col: number) => {
    const game = gameRef.current
    if (isOver) return

    if (highlightedCells.some(([r, c]) => r === row && c === col)) {
      game.makeMove(selectedCell![0], selectedCell![1], row, col)
      setSelectedCell(null)
      setHighlightedCells([])
      refreshBoard()
      if (game.isGameOver()) {
        const w = game.winner()
        setIsOver(true)
        setWinner(w)
        if (w === 'w') setWinsAtStage(n => n + 1)
      }
      return
    }

    const moves = game.getLegalMoves(row, col)
    if (moves.length > 0) {
      setSelectedCell([row, col])
      setHighlightedCells(moves)
    } else {
      setSelectedCell(null)
      setHighlightedCells([])
    }
  }, [isOver, highlightedCells, selectedCell])

  const advanceStage = useCallback(() => {
    const next = Math.min(stage + 1, 4)
    setStage(next)
    setWinsAtStage(0)
    gameRef.current = new MiniChess(STAGE_CONFIGS[next - 1])
    refreshBoard()
    setIsOver(false)
    setWinner(null)
    setSelectedCell(null)
    setHighlightedCells([])
  }, [stage])

  const resetGame = useCallback(() => {
    gameRef.current = new MiniChess(STAGE_CONFIGS[stage - 1])
    refreshBoard()
    setIsOver(false)
    setWinner(null)
    setSelectedCell(null)
    setHighlightedCells([])
  }, [stage])

  return {
    stage, board, isOver, winner, winsAtStage,
    selectedCell, highlightedCells,
    selectCell, advanceStage, resetGame,
    config: STAGE_CONFIGS[stage - 1],
    fenLike: gameRef.current.toFenLike(),
  }
}
