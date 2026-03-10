import { useState } from 'react'
import type { Track } from '../types'

interface OnboardingAnswers {
  experience: 'yes' | 'a-little' | 'never'
  age: number
  knowledgeCorrect: boolean
}

export function determineTrack({ experience, age, knowledgeCorrect }: OnboardingAnswers): Track {
  if (experience === 'never' || !knowledgeCorrect || age < 8) return 'explorer'
  if (age >= 12 && experience === 'yes' && knowledgeCorrect) return 'champion'
  return 'adventurer'
}

export interface OnboardingState {
  step: number
  experience: OnboardingAnswers['experience'] | null
  age: number
  knowledgeCorrect: boolean | null
  name: string
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    experience: null,
    age: 10,
    knowledgeCorrect: null,
    name: '',
  })

  function setExperience(experience: OnboardingAnswers['experience']) {
    setState(s => ({ ...s, experience, step: 2 }))
  }

  function setAge(age: number) {
    setState(s => ({ ...s, age, step: 3 }))
  }

  function setKnowledge(correct: boolean) {
    setState(s => ({ ...s, knowledgeCorrect: correct, step: 4 }))
  }

  function setName(name: string) {
    setState(s => ({ ...s, name }))
  }

  function getTrack(): Track {
    return determineTrack({
      experience: state.experience ?? 'never',
      age: state.age,
      knowledgeCorrect: state.knowledgeCorrect ?? false,
    })
  }

  return { state, setExperience, setAge, setKnowledge, setName, getTrack }
}
