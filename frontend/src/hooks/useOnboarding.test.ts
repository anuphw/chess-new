import { determineTrack } from './useOnboarding'

test('never played + age 7 + wrong answer → explorer', () => {
  expect(determineTrack({ experience: 'never', age: 7, knowledgeCorrect: false })).toBe('explorer')
})

test('played before + age 10 + correct answer → adventurer', () => {
  expect(determineTrack({ experience: 'yes', age: 10, knowledgeCorrect: true })).toBe('adventurer')
})

test('played before + age 13 + correct answer → champion', () => {
  expect(determineTrack({ experience: 'yes', age: 13, knowledgeCorrect: true })).toBe('champion')
})

test('a little experience + age 8 + correct → adventurer', () => {
  expect(determineTrack({ experience: 'a-little', age: 8, knowledgeCorrect: true })).toBe('adventurer')
})
