import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../services/firebase'

interface Props {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: Props) {
  async function handleSignIn() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    onLogin()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f1923' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>♟</div>
      <h1 style={{ color: '#ffd200', fontFamily: 'sans-serif', marginBottom: 8 }}>Magnus</h1>
      <p style={{ color: '#7eb8f7', marginBottom: 32, fontFamily: 'sans-serif' }}>Your Chess Coach</p>
      <button
        onClick={handleSignIn}
        style={{ background: '#ffd200', color: '#0f1923', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif' }}
      >
        Sign in with Google
      </button>
    </div>
  )
}
