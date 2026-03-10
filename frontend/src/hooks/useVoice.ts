import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.9
    utt.pitch = 1.1
    window.speechSynthesis.speak(utt)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? (window as Record<string, unknown>)['webkitSpeechRecognition'] as typeof SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      setTranscript(e.results[0][0].transcript)
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
