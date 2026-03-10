import { MiniChess } from './MiniChess'
import { STAGE_CONFIGS } from './stageConfigs'

test('stage 1: board initializes with king and rook', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  const pieces = game.getBoard().flat().filter(Boolean)
  expect(pieces.some(p => p?.toLowerCase() === 'k')).toBe(true)
  expect(pieces.some(p => p?.toLowerCase() === 'r')).toBe(true)
})

test('stage 1: rook can move horizontally', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  game.setBoardForTest([
    [null, null, 'K'],
    [null, null, null],
    ['R', null, 'k'],
  ])
  const moves = game.getLegalMoves(2, 0)
  expect(moves.some(([r, c]) => r === 1 && c === 0)).toBe(true)
})

test('isGameOver returns true when king is captured', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  game.setBoardForTest([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ])
  expect(game.isGameOver()).toBe(true)
})

test('currentPlayer alternates after move', () => {
  const game = new MiniChess(STAGE_CONFIGS[0])
  expect(game.currentPlayer).toBe('w')
  game.makeMove(0, 0, 1, 0) // rook from top-left down one
  expect(game.currentPlayer).toBe('b')
})
