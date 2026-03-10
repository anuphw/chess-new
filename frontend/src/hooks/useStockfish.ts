import { useState, useEffect, useRef, useCallback } from 'react'

export interface StockfishAnalysis {
  evaluation: number  // centipawns (positive = white advantage)
  bestMove: string    // UCI string e.g. "e2e4"
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null)
  const [analysis, setAnalysis] = useState<StockfishAnalysis | null>(null)
  const evalRef = useRef<number>(0)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/stockfish.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.postMessage('uci')
    worker.postMessage('isready')

    worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : e.data.toString()

      const cpMatch = line.match(/score cp (-?\d+)/)
      if (cpMatch) evalRef.current = parseInt(cpMatch[1])

      const bmMatch = line.match(/^bestmove (\S+)/)
      if (bmMatch && bmMatch[1] !== '(none)') {
        setAnalysis({ evaluation: evalRef.current, bestMove: bmMatch[1] })
      }
    }

    return () => worker.terminate()
  }, [])

  const analyze = useCallback((fen: string, depth = 15, skillLevel = 20) => {
    const w = workerRef.current
    if (!w) return
    setAnalysis(null)
    w.postMessage(`setoption name Skill Level value ${skillLevel}`)
    w.postMessage(`position fen ${fen}`)
    w.postMessage(`go depth ${depth}`)
  }, [])

  return { analysis, analyze }
}
