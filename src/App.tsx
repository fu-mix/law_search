import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SettingsModal } from './components/SettingsModal'
import { ApiSettingsProvider, useApiSettings } from './contexts/ApiSettingsContext'
import { useDifyChat } from './hooks/useDifyChat'

function ChatPage() {
  const { isConfigured } = useApiSettings()
  const { messages, loading, error, sendMessage } = useDifyChat()
  const [input, setInput] = useState('')
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isConfigured) setSettingsOpen(true)
  }, [isConfigured])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: messages.length ? 'smooth' : 'auto' })
  }, [messages, loading])

  const handleSend = () => {
    const next = input.trim()
    if (!next) return
    void sendMessage(next)
    setInput('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSend()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_5%_-10%,#fde68a66,transparent),radial-gradient(900px_500px_at_95%_0%,#93c5fd55,transparent),linear-gradient(180deg,#fff7ed,#fef3c7)] text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 animate-[fadeUp_0.5s_ease-out]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Law Search</p>
            <h1 className="text-3xl font-semibold">法令検索チャット</h1>
            <p className="mt-1 text-sm text-slate-600">Dify × e-Gov 法令API</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isConfigured ? '設定済み' : '未設定'}
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              設定 ⚙️
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-amber-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]">
            <div className="flex min-h-[55vh] flex-col gap-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 animate-[fadeIn_0.5s_ease-out]">
                  法令名や条文について質問してください。例: 「労働基準法の時間外労働の上限は？」
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`animate-[fadeUp_0.35s_ease-out] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'ml-auto max-w-[80%] bg-emerald-500 text-white'
                      : 'mr-auto max-w-[80%] border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="whitespace-pre-wrap">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content || '...'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="text-xs text-slate-500">ストリーミング中...</div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)]"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConfigured || loading}
              placeholder={isConfigured ? '質問を入力（Shift+Enterで改行）' : '設定を完了してください'}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Enterで送信、Shift+Enterで改行
              </p>
              <button
                type="submit"
                disabled={!isConfigured || loading}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                送信
              </button>
            </div>
          </form>
        </section>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ApiSettingsProvider>
      <ChatPage />
    </ApiSettingsProvider>
  )
}
