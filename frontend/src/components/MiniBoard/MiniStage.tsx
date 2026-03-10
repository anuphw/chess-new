import { useState, useEffect, useCallback } from 'react'
import { useMiniChess } from '../../hooks/useMiniChess'
import { fetchCoachResponse } from '../../services/coachApi'
import CoachPanel from '../Coach/CoachPanel'
import type { UserProfile, CoachMessage } from '../../types'

interface Props {
  profile: UserProfile
  onGraduate: () => void
}

const WINS_TO_ADVANCE = 3

export default function MiniStage({ profile, onGraduate }: Props) {
  const mini = useMiniChess(profile.miniBoardStage)
  const [messages, setMessages] = useState<CoachMessage[]>([])

  useEffect(() => {
    if (mini.isOver && mini.winner === 'w') {
      if (mini.winsAtStage >= WINS_TO_ADVANCE) {
        if (mini.stage >= 4) {
          onGraduate()
        } else {
          mini.advanceStage()
        }
      } else {
        mini.resetGame()
      }
    }
  }, [mini.isOver, mini.winner, mini.winsAtStage, mini.stage, mini.advanceStage, mini.resetGame, onGraduate])

  const sendUserMessage = useCallback(async (text: string) => {
    const userMsg: CoachMessage = { role: 'user', text }
    setMessages(prev => {
      const updated = [...prev, userMsg]
      fetchCoachResponse({
        fen: mini.fenLike,
        lastMove: '',
        evaluation: 0,
        bestMove: '',
        lessonTopic: profile.currentLesson,
        track: profile.track,
        history: updated,
        userMessage: text,
      }).then(reply => {
        setMessages(m => [...m, { role: 'coach', text: reply }])
      })
      return updated
    })
  }, [mini.fenLike, profile.currentLesson, profile.track])

  const { rows, cols } = mini.config
  const cellSize = Math.min(60, Math.floor(320 / Math.max(rows, cols)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ textAlign: 'center', padding: '12px', color: '#ffd200', fontFamily: 'sans-serif' }}>
        Stage {mini.stage} — Wins: {mini.winsAtStage}/{WINS_TO_ADVANCE}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 2 }}>
          {mini.board.map((row, r) =>
            row.map((piece, c) => {
              const isSelected = mini.selectedCell?.[0] === r && mini.selectedCell?.[1] === c
              const isHighlighted = mini.highlightedCells.some(([hr, hc]) => hr === r && hc === c)
              const isLight = (r + c) % 2 === 0
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => mini.selectCell(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isSelected ? '#ffd200' : isHighlighted ? 'rgba(0,200,100,0.5)' : isLight ? '#f0d9b5' : '#b58863',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize * 0.6, cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {piece && pieceEmoji(piece)}
                </div>
              )
            })
          )}
        </div>
      </div>
      <CoachPanel messages={messages} onSendMessage={sendUserMessage} />
    </div>
  )
}

function pieceEmoji(piece: string): string {
  const map: Record<string, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  }
  return map[piece] ?? piece
}
