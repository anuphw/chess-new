import { useState, useEffect, useCallback } from 'react'
import type { Square } from 'chess.js'
import { useChessGame } from '../../hooks/useChessGame'
import { useStockfish } from '../../hooks/useStockfish'
import { useMoveHints } from '../../hooks/useMoveHints'
import { useVoice } from '../../hooks/useVoice'
import { fetchCoachResponse } from '../../services/coachApi'
import ChessBoard from '../Board/ChessBoard'
import CoachPanel from '../Coach/CoachPanel'
import type { UserProfile, CoachMessage } from '../../types'

interface Props {
  profile: UserProfile
  onGameSaved: () => void
}

export default function GamePage({ profile, onGameSaved }: Props) {
  const game = useChessGame()
  const { analysis, analyze } = useStockfish()
  const { hintsEnabled, toggle: toggleHints } = useMoveHints()
  const { speak } = useVoice()

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([])
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [prevEval, setPrevEval] = useState<number>(0)

  // Run Stockfish after player (white) moves — Stockfish plays as Black
  useEffect(() => {
    if (game.turn === 'b' && !game.isGameOver) {
      analyze(game.fen, 15, profile.skillLevel)
    }
  }, [game.fen])

  // Play Stockfish's best move as Black, then detect blunder and request coach
  useEffect(() => {
    if (!analysis) return

    // Play AI move if it's still Black's turn
    if (game.turn === 'b' && !game.isGameOver) {
      const from = analysis.bestMove.slice(0, 2) as Square
      const to = analysis.bestMove.slice(2, 4) as Square
      game.makeMove(from, to)
    }

    // Blunder detection (drop from white's perspective after white's last move)
    const drop = prevEval - analysis.evaluation
    const isBlunder = drop > 200
    setPrevEval(analysis.evaluation)

    fetchCoachResponse({
      fen: game.fen,
      lastMove: game.lastMove ?? '',
      evaluation: analysis.evaluation / 100,
      bestMove: analysis.bestMove,
      lessonTopic: profile.currentLesson,
      track: profile.track,
      history: messages,
      userMessage: isBlunder ? 'I just made a move' : '',
    }).then(msg => {
      const coachMsg: CoachMessage = { role: 'coach', text: msg }
      setMessages(prev => [...prev, coachMsg])
      speak(msg)
    })
  }, [analysis])

  const onSquareClick = useCallback((square: Square) => {
    if (highlightedSquares.includes(square)) {
      game.makeMove(selectedSquare!, square)
      setSelectedSquare(null)
      setHighlightedSquares([])
      return
    }
    const moves = game.getLegalMoves(square)
    if (moves.length > 0) {
      setSelectedSquare(square)
      setHighlightedSquares(hintsEnabled ? moves : [])
    } else {
      setSelectedSquare(null)
      setHighlightedSquares([])
    }
  }, [highlightedSquares, selectedSquare, game, hintsEnabled])

  async function sendUserMessage(text: string) {
    const userMsg: CoachMessage = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    const reply = await fetchCoachResponse({
      fen: game.fen,
      lastMove: game.lastMove ?? '',
      evaluation: (analysis?.evaluation ?? 0) / 100,
      bestMove: analysis?.bestMove ?? '',
      lessonTopic: profile.currentLesson,
      track: profile.track,
      history: [...messages, userMsg],
      userMessage: text,
    })
    const coachMsg: CoachMessage = { role: 'coach', text: reply }
    setMessages(prev => [...prev, coachMsg])
    speak(reply)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px' }}>
        <button
          title="Toggle hints"
          onClick={toggleHints}
          style={{ background: 'none', border: '1px solid #ffd200', borderRadius: 6, color: '#ffd200', padding: '4px 10px', cursor: 'pointer', fontSize: 18 }}
        >
          💡
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <ChessBoard
          fen={game.fen}
          onSquareClick={onSquareClick}
          highlightedSquares={highlightedSquares}
        />
      </div>
      <CoachPanel messages={messages} onSendMessage={sendUserMessage} />
    </div>
  )
}
