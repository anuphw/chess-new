// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Stockfish: () => any

const engine = Stockfish()
engine.onmessage = (msg: string) => postMessage(msg)
onmessage = (e: MessageEvent) => engine.postMessage(e.data)
