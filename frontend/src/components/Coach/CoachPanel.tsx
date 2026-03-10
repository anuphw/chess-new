import type { CoachMessage } from '../../types'

interface Props {
  messages: CoachMessage[]
  onSendMessage: (text: string) => void
}

export default function CoachPanel({ messages: _messages, onSendMessage: _onSendMessage }: Props) {
  return <div>CoachPanel</div>
}
