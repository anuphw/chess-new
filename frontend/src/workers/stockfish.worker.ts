import Stockfish from 'stockfish'

const engine = Stockfish()
engine.onmessage = (msg: string) => postMessage(msg)
onmessage = (e: MessageEvent) => engine.postMessage(e.data)
