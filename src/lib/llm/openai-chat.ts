/**
 * OpenAI direct chat completions 어댑터.
 * 호출: POST https://api.openai.com/v1/chat/completions
 *
 * GitHub Models와 동일한 OpenAI-compatible 형식을 사용 — _openai-compat.ts 공유.
 */

import type { ChatRequest, ChatResponseChunk } from '#/types/llm'
import { callOpenAiCompat, streamOpenAiCompat } from './_openai-compat'

const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

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
    throw new Error('OpenAI API 키가 설정되지 않았습니다. Settings 페이지에서 입력하세요.')
  }
  return streamOpenAiCompat(request, {
    endpoint: OPENAI_CHAT_ENDPOINT,
    buildHeaders: () => ({ Authorization: `Bearer ${options.apiKey}` }),
    apiKey: options.apiKey,
    signal: options.signal,
    onChunk: options.onChunk,
  })
}

export async function chatCompletion(
  request: ChatRequest,
  options: { apiKey: string; signal?: AbortSignal },
) {
  if (!options.apiKey) throw new Error('OpenAI API 키가 설정되지 않았습니다.')
  return callOpenAiCompat(request, {
    endpoint: OPENAI_CHAT_ENDPOINT,
    buildHeaders: () => ({ Authorization: `Bearer ${options.apiKey}` }),
    apiKey: options.apiKey,
    signal: options.signal,
  })
}
