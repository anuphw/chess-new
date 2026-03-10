import type { CoachRequest } from '../types'

const API_URL = import.meta.env.VITE_COACH_API_URL ?? 'http://localhost:8000'

export async function fetchCoachResponse(req: CoachRequest): Promise<string> {
  const res = await fetch(`${API_URL}/coach/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`Coach API error: ${res.status}`)
  const data = await res.json()
  return data.message as string
}
