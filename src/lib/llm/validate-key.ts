/**
 * API 키 사전 검증 — 사용자가 Settings에서 명시적으로 "검증" 버튼을 눌렀을 때만 호출.
 *
 * - GitHub Models: chat/completions에 max_tokens=1로 가벼운 호출
 * - OpenAI: GET /v1/models (단순 인증 체크)
 * - Azure: skip (endpoint+deployment 조합 검증 복잡)
 * - Hugging Face: GET /api/whoami-v2
 *
 * 자동 검증은 의도적으로 안 함 (네트워크 비용 + rate limit 우려).
 */

import { buildErrorMessage, type LlmProvider } from './error-messages'

export type ValidateResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; raw?: string }

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions'
const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models'
const HF_WHOAMI_ENDPOINT = 'https://huggingface.co/api/whoami-v2'

export async function validateGitHubModels(apiKey: string): Promise<ValidateResult> {
  if (!apiKey) return { ok: false, message: 'API 키가 비어 있습니다.' }
  try {
    const res = await fetch(GITHUB_MODELS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    })
    if (res.ok) return { ok: true, message: '검증 성공' }
    const body = await res.text().catch(() => '')
    const info = buildErrorMessage('github-models', res.status, body, res.statusText)
    return { ok: false, message: info.friendly, raw: info.raw }
  } catch (err) {
    return { ok: false, message: networkErrorMessage('github-models', err) }
  }
}

export async function validateOpenAi(apiKey: string): Promise<ValidateResult> {
  if (!apiKey) return { ok: false, message: 'API 키가 비어 있습니다.' }
  try {
    const res = await fetch(OPENAI_MODELS_ENDPOINT, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { ok: true, message: '검증 성공' }
    const body = await res.text().catch(() => '')
    const info = buildErrorMessage('openai', res.status, body, res.statusText)
    return { ok: false, message: info.friendly, raw: info.raw }
  } catch (err) {
    return { ok: false, message: networkErrorMessage('openai', err) }
  }
}

export async function validateHuggingFace(apiKey: string): Promise<ValidateResult> {
  if (!apiKey) return { ok: false, message: 'API 키가 비어 있습니다.' }
  try {
    const res = await fetch(HF_WHOAMI_ENDPOINT, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { ok: true, message: '검증 성공' }
    const body = await res.text().catch(() => '')
    const info = buildErrorMessage('huggingface', res.status, body, res.statusText)
    return { ok: false, message: info.friendly, raw: info.raw }
  } catch (err) {
    return { ok: false, message: networkErrorMessage('huggingface', err) }
  }
}

function networkErrorMessage(provider: LlmProvider, err: unknown): string {
  const info = buildErrorMessage(provider, 0, err instanceof Error ? err.message : String(err))
  return info.friendly
}
