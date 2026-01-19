import { useCallback, useRef, useState } from 'react'
import { useApiSettings } from '../contexts/ApiSettingsContext'
import type { ChatMessage, DifyStreamEvent } from '../types'

const getUserId = () => {
  const key = 'dify_user_id'
  let id = localStorage.getItem(key)
  if (!id) {
    const fallback = `web-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const uuid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : fallback
    id = uuid
    localStorage.setItem(key, id)
  }
  return id
}

export function useDifyChat() {
  const { baseUrl, apiKey, isConfigured } = useApiSettings()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const extractOutputText = (outputs: unknown) => {
    if (typeof outputs === 'string') {
      const trimmed = outputs.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return null
      return trimmed || null
    }

    if (!outputs || typeof outputs !== 'object') return null

    const record = outputs as Record<string, unknown>
    const candidateKeys = ['answer', 'result', 'text', 'message', 'content', 'output', 'response']

    for (const key of candidateKeys) {
      const value = record[key]
      if (typeof value === 'string') return value
      if (typeof value === 'number' || typeof value === 'boolean') return String(value)
      if (Array.isArray(value)) {
        const joined = value.filter((item) => typeof item === 'string').join('\n')
        if (joined) return joined
      }
    }

    return null
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const query = text.trim()
      if (!query) return

      if (!isConfigured) {
        setError('API settings are required.')
        return
      }

      setError(null)
      setLoading(true)
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: query,
      }
      const assistantId = `a-${Date.now()}-${Math.random().toString(16).slice(2)}`
      let assistantText = ''

      const updateAssistant = (content: string) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content } : message,
          ),
        )
      }

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '' },
      ])

      const resolvedBaseUrl =
        import.meta.env.DEV && baseUrl === 'https://api.dify.ai/v1' ? '/dify' : baseUrl
      const endpoint = `${resolvedBaseUrl.replace(/\/$/, '')}/workflows/run`
      const payload = {
        inputs: { message: query },
        response_mode: 'streaming',
        user: getUserId(),
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (res.status === 401) {
          updateAssistant('認証エラーです。設定を確認してください。')
          setError('Unauthorized (401). Please check your API key.')
          return
        }

        if (!res.ok || !res.body) {
          let detail = ''
          try {
            const text = await res.text()
            if (text) {
              try {
                const parsed = JSON.parse(text) as { message?: string }
                detail = parsed.message ?? text
              } catch {
                detail = text
              }
            }
          } catch {
            detail = ''
          }

          updateAssistant('応答に失敗しました。設定や接続を確認してください。')
          setError(`Request failed (${res.status}).${detail ? ` ${detail}` : ''}`)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const data = trimmed.slice(5).trim()
            if (!data || data === '[DONE]') continue

            try {
              const event = JSON.parse(data) as DifyStreamEvent
              if (event.event === 'error' && event.message) {
                updateAssistant('エラーが発生しました。設定を確認してください。')
                setError(event.message)
                continue
              }

              if (typeof event.answer === 'string') {
                assistantText += event.answer
                updateAssistant(assistantText)
                continue
              }

              if (event.data?.text) {
                assistantText += event.data.text
                updateAssistant(assistantText)
                continue
              }

              if (event.data?.outputs) {
                const outputText = extractOutputText(event.data.outputs)
                if (outputText && assistantText.length === 0) {
                  assistantText = outputText
                  updateAssistant(assistantText)
                }
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          updateAssistant('通信エラーが発生しました。時間をおいて再試行してください。')
          setError('Network error. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [apiKey, baseUrl, isConfigured],
  )

  return { messages, loading, error, isConfigured, sendMessage }
}
