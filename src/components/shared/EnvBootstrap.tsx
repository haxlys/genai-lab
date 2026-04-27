import { useEffect, useState } from 'react'
import { getEnvKeys } from '#/lib/env'
import { getSettings, updateSettings } from '#/lib/storage/settings'

const BOOTSTRAP_FLAG_KEY = 'genai-lab:env-bootstrapped:v1'

/**
 * 앱 부팅 시 1회만 server function을 호출해 .env 키를 클라이언트로 가져온다.
 * 이미 localStorage에 키가 있으면 덮어쓰지 않으며, .env에서 새 키가 발견되면
 * envInjected 플래그를 켜서 Settings UI에 표시.
 */
export function EnvBootstrap() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    if (typeof window === 'undefined') return
    // 이미 처리된 적이 있으면 skip (단, 사용자가 명시적으로 재시도하지 않는 한)
    if (sessionStorage.getItem(BOOTSTRAP_FLAG_KEY)) {
      setDone(true)
      return
    }

    let cancelled = false

    getEnvKeys()
      .then((env) => {
        if (cancelled) return
        const current = getSettings()
        const next = { ...current.apiKeys }
        const injected: typeof current.envInjected = { ...current.envInjected }
        let changed = false

        // 각 키별로: localStorage가 비어 있고 .env에 값이 있으면 가져옴
        const fields = ['githubModels', 'openai', 'azureApiKey', 'azureEndpoint', 'azureDeployment', 'huggingface'] as const
        for (const field of fields) {
          if (!next[field] && env[field]) {
            next[field] = env[field]
            injected[field] = true
            changed = true
          }
        }

        if (changed) {
          updateSettings({ apiKeys: next, envInjected: injected })
        }
      })
      .catch((err) => {
        // 빌드 타임/SSR이거나 server function이 실패한 경우 — 무시 (BYOK fallback)
        console.warn('env bootstrap failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          sessionStorage.setItem(BOOTSTRAP_FLAG_KEY, '1')
          setDone(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [done])

  return null
}
