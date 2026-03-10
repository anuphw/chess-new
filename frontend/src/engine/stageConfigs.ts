import type { StageConfig } from '../types'

export const STAGE_CONFIGS: StageConfig[] = [
  { stage: 1, rows: 3, cols: 3, pieces: ['k', 'r'] },
  { stage: 2, rows: 4, cols: 4, pieces: ['k', 'r', 'b'] },
  { stage: 3, rows: 6, cols: 6, pieces: ['k', 'q', 'r', 'b', 'p'] },
  { stage: 4, rows: 6, cols: 6, pieces: ['k', 'q', 'r', 'b', 'n', 'p'] },
]
