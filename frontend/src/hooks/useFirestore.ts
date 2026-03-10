import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { UserProfile, GameRecord } from '../types'

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { uid, ...data } = profile
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function loadUserProfile(uid: string): Promise<Omit<UserProfile, 'uid'> | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as Omit<UserProfile, 'uid'>
}

export async function saveGameRecord(uid: string, game: GameRecord): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'games'), game)
}
