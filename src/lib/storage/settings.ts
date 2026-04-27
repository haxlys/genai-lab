/**
 * 설정 저장소 — API 키, 기본 provider, 다크 모드를 localStorage에 영속.
 * BYOK 전략: 모든 API 키는 사용자 브라우저에만 머물고 서버로 전송되지 않는다.
 */

import type { Provider } from '#/types/llm'

const SETTINGS_KEY = 'genai-lab:settings:v1'

export type ApiKeyMap = {
  /** GitHub Models PAT (https://models.inference.ai.azure.com 용) */
  githubModels: string
  openai: string
  azureApiKey: string
  azureEndpoint: string
  azureDeployment: string
  huggingface: string
}

export type Settings = {
  apiKeys: ApiKeyMap
  defaultProvider: Provider
  defaultModel: string
  theme: 'system' | 'light' | 'dark'
  /** server function이 .env에서 1회 주입한 키들 — UI 마스킹/표기용 플래그 */
  envInjected: Partial<Record<keyof ApiKeyMap, boolean>>
}

const DEFAULT_SETTINGS: Settings = {
  apiKeys: {
    githubModels: '',
    openai: '',
    azureApiKey: '',
    azureEndpoint: '',
    azureDeployment: '',
    huggingface: '',
  },
  defaultProvider: 'github-models',
  defaultModel: 'gpt-4o-mini',
  theme: 'system',
  envInjected: {},
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function getSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(parsed.apiKeys ?? {}) },
      envInjected: { ...(parsed.envInjected ?? {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(next: Settings): void {
  if (!isBrowser()) return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const current = getSettings()
  const next: Settings = {
    ...current,
    ...patch,
    apiKeys: { ...current.apiKeys, ...(patch.apiKeys ?? {}) },
    envInjected: { ...current.envInjected, ...(patch.envInjected ?? {}) },
  }
  saveSettings(next)
  return next
}

/** 특정 provider에 사용할 API 키를 반환. 없으면 빈 문자열. */
export function getKeyForProvider(provider: Provider, settings = getSettings()): string {
  switch (provider) {
    case 'github-models':
      return settings.apiKeys.githubModels
    case 'openai':
      return settings.apiKeys.openai
    case 'azure':
      return settings.apiKeys.azureApiKey
    case 'huggingface':
      return settings.apiKeys.huggingface
  }
}
