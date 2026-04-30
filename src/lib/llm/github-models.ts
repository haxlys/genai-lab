/**
 * GitHub Models 어댑터 — fine-grained PAT를 사용해 https://models.inference.ai.azure.com
 * 의 chat completions 엔드포인트를 직접 호출. SSE 스트리밍 지원.
 *
 * 사용자 토큰은 브라우저에서만 사용되고 서버로 프록시되지 않는다(BYOK).
 *
 * OpenAI/Azure와 같은 OpenAI-compatible 형식이라 _openai-compat.ts를 공유.
 */

import type { ChatRequest, ChatResponseChunk } from '#/types/llm'
import { callOpenAiCompat, streamOpenAiCompat } from './_openai-compat'
import { LlmHttpError, buildErrorMessage } from './error-messages'

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions'

export type StreamingOptions = {
  apiKey: string
  signal?: AbortSignal
  onChunk: (chunk: ChatResponseChunk) => void
}

export async function streamChatCompletion(
  request: ChatRequest,
  options: StreamingOptions,
): Promise<void> {
  if (!options.apiKey) {
    throw new Error('GitHub Models PAT이 설정되지 않았습니다. Settings 페이지에서 입력하세요.')
  }
  return streamOpenAiCompat(request, {
    endpoint: GITHUB_MODELS_ENDPOINT,
    buildHeaders: () => ({ Authorization: `Bearer ${options.apiKey}` }),
    apiKey: options.apiKey,
    signal: options.signal,
    onChunk: options.onChunk,
    buildError: (status, body, statusText) =>
      new LlmHttpError(buildErrorMessage('github-models', status, body, statusText)),
  })
}

export async function chatCompletion(
  request: ChatRequest,
  options: { apiKey: string; signal?: AbortSignal },
) {
  if (!options.apiKey) throw new Error('GitHub Models PAT이 설정되지 않았습니다.')
  return callOpenAiCompat(request, {
    endpoint: GITHUB_MODELS_ENDPOINT,
    buildHeaders: () => ({ Authorization: `Bearer ${options.apiKey}` }),
    apiKey: options.apiKey,
    signal: options.signal,
    buildError: (status, body, statusText) =>
      new LlmHttpError(buildErrorMessage('github-models', status, body, statusText)),
  })
}
