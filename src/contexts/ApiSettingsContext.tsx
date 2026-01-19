import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ApiSettings = {
  baseUrl: string
  apiKey: string
}

type ApiSettingsContextValue = ApiSettings & {
  isConfigured: boolean
  saveSettings: (next: ApiSettings) => void
}

const STORAGE_KEY = 'dify_api_settings'
const DEFAULT_BASE_URL = 'https://api.dify.ai/v1'
const ApiSettingsContext = createContext<ApiSettingsContextValue | undefined>(undefined)

const readSettings = (): ApiSettings => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { baseUrl: DEFAULT_BASE_URL, apiKey: '' }
    const parsed = JSON.parse(raw) as Partial<ApiSettings>
    const normalizedBaseUrl = (parsed.baseUrl ?? '').trim()
    return {
      baseUrl: normalizedBaseUrl || DEFAULT_BASE_URL,
      apiKey: parsed.apiKey ?? '',
    }
  } catch {
    return { baseUrl: DEFAULT_BASE_URL, apiKey: '' }
  }
}

export function ApiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ApiSettings>(() => readSettings())

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const value = useMemo<ApiSettingsContextValue>(() => {
    const isConfigured = settings.baseUrl.trim() !== '' && settings.apiKey.trim() !== ''
    return {
      ...settings,
      isConfigured,
      saveSettings: setSettings,
    }
  }, [settings])

  return <ApiSettingsContext.Provider value={value}>{children}</ApiSettingsContext.Provider>
}

export function useApiSettings() {
  const ctx = useContext(ApiSettingsContext)
  if (!ctx) {
    throw new Error('useApiSettings must be used within ApiSettingsProvider')
  }
  return ctx
}
