import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './services/firebase'
import { loadUserProfile, saveUserProfile } from './hooks/useFirestore'
import LoginPage from './components/Login/LoginPage'
import Onboarding from './components/Onboarding/Onboarding'
import MiniStage from './components/MiniBoard/MiniStage'
import GamePage from './components/Game/GamePage'
import type { UserProfile, Track } from './types'

type AppState = 'loading' | 'login' | 'onboarding' | 'mini' | 'game'

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { setAppState('login'); return }
      setUser(u)
      const existing = await loadUserProfile(u.uid)
      if (!existing) {
        setAppState('onboarding')
      } else {
        const p: UserProfile = { uid: u.uid, ...existing } as UserProfile
        setProfile(p)
        setAppState(p.miniBoardStage < 5 && p.track === 'explorer' ? 'mini' : 'game')
      }
    })
  }, [])

  async function handleOnboardingComplete({ name, track }: { name: string; track: Track }) {
    const p: UserProfile = {
      uid: user!.uid, name, track, skillLevel: 5, miniBoardStage: 1,
      winsAtCurrentStage: 0, currentLesson: 'rook',
      piecesUnlocked: [], puzzlesSolved: 0, gamesPlayed: 0,
    }
    await saveUserProfile(p)
    setProfile(p)
    setAppState(track === 'explorer' ? 'mini' : 'game')
  }

  function handleGraduate() {
    if (!profile) return
    const updated = { ...profile, miniBoardStage: 5 }
    setProfile(updated)
    saveUserProfile(updated)
    setAppState('game')
  }

  if (appState === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f1923', color: '#ffd200', fontFamily: 'sans-serif', fontSize: 24 }}>
      ♟ Loading...
    </div>
  )
  if (appState === 'login') return <LoginPage onLogin={() => {}} />
  if (appState === 'onboarding') return <Onboarding onComplete={handleOnboardingComplete} />
  if (appState === 'mini' && profile) return <MiniStage profile={profile} onGraduate={handleGraduate} />
  if (appState === 'game' && profile) return <GamePage profile={profile} onGameSaved={() => {}} />
  return null
}
