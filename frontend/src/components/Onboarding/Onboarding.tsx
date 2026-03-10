import { useOnboarding } from '../../hooks/useOnboarding'
import type { Track } from '../../types'

interface Props {
  onComplete: (result: { name: string; track: Track }) => void
}

const btn = {
  background: '#ffd200', color: '#0f1923', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 15,
  fontWeight: 'bold', cursor: 'pointer', margin: 4,
}
const wrap = {
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
  justifyContent: 'center', minHeight: '100vh', background: '#0f1923',
  color: '#e2e8f0', fontFamily: 'sans-serif', gap: 16,
}

export default function Onboarding({ onComplete }: Props) {
  const { state, setExperience, setAge, setKnowledge, setName, getTrack } = useOnboarding()

  if (state.step === 1) return (
    <div style={wrap}>
      <h2>Have you played before?</h2>
      <button style={btn} onClick={() => setExperience('yes')}>Yes</button>
      <button style={btn} onClick={() => setExperience('a-little')}>A little</button>
      <button style={btn} onClick={() => setExperience('never')}>Never</button>
    </div>
  )

  if (state.step === 2) return (
    <div style={wrap}>
      <h2>How old are you?</h2>
      <input type="range" min={4} max={18} value={state.age}
        onChange={e => setAge(Number(e.target.value))} />
      <p>{state.age} years old</p>
      <button style={btn} onClick={() => setAge(state.age)}>Next</button>
    </div>
  )

  if (state.step === 3) return (
    <div style={wrap}>
      <h2>Can a rook move diagonally?</h2>
      <button style={btn} onClick={() => setKnowledge(false)}>No</button>
      <button style={btn} onClick={() => setKnowledge(true)}>Yes</button>
    </div>
  )

  return (
    <div style={wrap}>
      <h2>What&apos;s your name?</h2>
      <input
        placeholder="Your name"
        value={state.name}
        onChange={e => setName(e.target.value)}
        style={{ padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 16 }}
      />
      <button style={btn} onClick={() => onComplete({ name: state.name, track: getTrack() })}>
        Let&apos;s go!
      </button>
    </div>
  )
}
