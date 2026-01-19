export type Role = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: Role
  content: string
}

export type DifyStreamEvent = {
  event?: string
  message_id?: string
  conversation_id?: string
  answer?: string
  message?: string
  data?: {
    outputs?: Record<string, unknown> | string
    text?: string
  }
}
