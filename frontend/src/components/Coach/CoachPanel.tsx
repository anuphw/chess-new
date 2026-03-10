import { useEffect } from 'react'
import { useVoice } from '../../hooks/useVoice'
import type { CoachMessage } from '../../types'

interface Props {
  messages: CoachMessage[]
  onSendMessage: (text: string) => void
}

export default function CoachPanel({ messages, onSendMessage }: Props) {
  const { speak: _speak, startListening, stopListening, listening, transcript } = useVoice()

  useEffect(() => {
    if (transcript) onSendMessage(transcript)
  }, [transcript, onSendMessage])

  const lastCoachMsg = [...messages].reverse().find(m => m.role === 'coach')

  return (
    <div style={{
      background: '#0a1628', borderTop: '1px solid #1e3a5f',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 32 }}>🧙</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#ffd200', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
          Magnus
        </div>
        <div style={{ color: '#7eb8f7', fontFamily: 'sans-serif', fontSize: 14, minHeight: 20 }}>
          {lastCoachMsg?.text ?? 'Ready to play!'}
        </div>
      </div>
      <button
        title="Speak to Magnus"
        onClick={listening ? stopListening : startListening}
        style={{
          background: listening ? '#ffd200' : 'transparent',
          border: '2px solid #ffd200', borderRadius: '50%',
          width: 44, height: 44, fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        🎤
      </button>
    </div>
  )
}
