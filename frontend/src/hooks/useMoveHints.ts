import { useState, useCallback } from 'react'

const KEY = 'chess-move-hints'

export function useMoveHints() {
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(KEY)
    return stored === null ? true : stored === 'true'
  })

  const toggle = useCallback(() => {
    setHintsEnabled(prev => {
      const next = !prev
      localStorage.setItem(KEY, String(next))
      return next
    })
  }, [])

  return { hintsEnabled, toggle }
}
