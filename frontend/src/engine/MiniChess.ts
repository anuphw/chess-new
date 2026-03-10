import type { StageConfig } from '../types'

type Piece = string | null

export class MiniChess {
  private board: Piece[][]
  currentPlayer: 'w' | 'b' = 'w'
  private config: StageConfig

  constructor(config: StageConfig) {
    this.config = config
    this.board = this.initBoard(config)
  }

  private initBoard(config: StageConfig): Piece[][] {
    const { rows, cols } = config
    const b: Piece[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    if (config.pieces.includes('k')) {
      b[0][cols - 1] = 'K'
      b[rows - 1][0] = 'k'
    }
    if (config.pieces.includes('r')) {
      b[0][0] = 'R'
    }
    if (config.pieces.includes('b') && cols >= 4) {
      b[0][1] = 'B'
    }
    if (config.pieces.includes('q') && cols >= 6) {
      b[0][2] = 'Q'
    }
    return b
  }

  setBoardForTest(board: Piece[][]) {
    this.board = board
  }

  getBoard(): Piece[][] {
    return this.board.map(r => [...r])
  }

  getLegalMoves(row: number, col: number): [number, number][] {
    const piece = this.board[row][col]
    if (!piece) return []
    const isWhite = piece === piece.toUpperCase()
    if ((isWhite && this.currentPlayer !== 'w') || (!isWhite && this.currentPlayer !== 'b')) return []

    const moves: [number, number][] = []
    const type = piece.toLowerCase()
    const { rows, cols } = this.config

    const addIfValid = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false
      const target = this.board[r][c]
      if (target) {
        const targetIsWhite = target === target.toUpperCase()
        if (isWhite !== targetIsWhite) moves.push([r, c])
        return false
      }
      moves.push([r, c])
      return true
    }

    const slide = (dr: number, dc: number) => {
      let r = row + dr, c = col + dc
      while (addIfValid(r, c)) { r += dr; c += dc }
    }

    if (type === 'r') { slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1) }
    if (type === 'b') { slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1) }
    if (type === 'q') { slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1); slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1) }
    if (type === 'k') {
      for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) addIfValid(row + dr, col + dc)
    }
    if (type === 'n') {
      for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) addIfValid(row + dr, col + dc)
    }
    if (type === 'p') {
      const dir = isWhite ? -1 : 1
      addIfValid(row + dir, col)
    }

    return moves
  }

  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const legal = this.getLegalMoves(fromRow, fromCol)
    if (!legal.some(([r, c]) => r === toRow && c === toCol)) return false
    this.board[toRow][toCol] = this.board[fromRow][fromCol]
    this.board[fromRow][fromCol] = null
    this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w'
    return true
  }

  isGameOver(): boolean {
    const pieces = this.board.flat().filter(Boolean)
    const hasWhiteKing = pieces.some(p => p === 'K')
    const hasBlackKing = pieces.some(p => p === 'k')
    return !hasWhiteKing || !hasBlackKing
  }

  winner(): 'w' | 'b' | null {
    if (!this.isGameOver()) return null
    const pieces = this.board.flat().filter(Boolean)
    return pieces.some(p => p === 'K') ? 'w' : 'b'
  }

  toFenLike(): string {
    return this.board.map(row => row.map(p => p ?? '.').join('')).join('/')
  }
}
