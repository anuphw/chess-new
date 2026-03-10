import { useState, useCallback, useRef } from 'react'

// Web Speech API types not in standard lib — declare minimally
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  onresult: ((e: Event) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

interface ISpeechRecognitionResult {
  transcript: string
}

interface ISpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: ISpeechRecognitionResult } }
}

type SpeechRecognitionCtor = new () => ISpeechRecognition

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>
  return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as SpeechRecognitionCtor | null ?? null
}

export function useVoice() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.9
    utt.pitch = 1.1
    window.speechSynthesis.speak(utt)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e: Event) => {
      const ev = e as ISpeechRecognitionEvent
      setTranscript(ev.results[0][0].transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { speak, startListening, stopListening, listening, transcript }
}
