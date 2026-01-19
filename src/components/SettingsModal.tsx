import { useEffect, useState } from 'react'
import { useApiSettings } from '../contexts/ApiSettingsContext'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { baseUrl, apiKey, saveSettings } = useApiSettings()
  const [draftApiKey, setDraftApiKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDraftApiKey(apiKey)
    }
  }, [isOpen, baseUrl, apiKey])

  if (!isOpen) return null

  const handleSave = () => {
    saveSettings({ baseUrl, apiKey: draftApiKey.trim() })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-amber-200/80 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Settings</p>
            <h2 className="text-xl font-semibold text-slate-900">API設定</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700">API Key</label>
        <div className="mb-4 flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={draftApiKey}
            onChange={(event) => setDraftApiKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="button"
            onClick={() => setShowKey((prev) => !prev)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            APIキーはセッションに保存され、ブラウザを閉じると消えます。
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
