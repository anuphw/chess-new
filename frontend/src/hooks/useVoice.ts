export function useVoice() {
  return {
    speak: (_text: string) => {},
    listening: false,
    startListening: () => {},
    stopListening: () => {},
    transcript: '',
  }
}
