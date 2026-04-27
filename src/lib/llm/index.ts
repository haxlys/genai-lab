/**
 * Provider-agnostic LLM 어댑터.
 * MVP에서는 github-models만 구현. openai/azure는 후속 단계에서 추가.
 */

import * as githubModels from './github-models'
import type { ChatRequest, ChatResponseChunk, ChatRunResult } from '#/types/llm'

export type StreamOptions = {
  apiKey: string
  signal?: AbortSignal
  onChunk: (chunk: ChatResponseChunk) => void
}

/** 프로바이더에 따라 적절한 어댑터로 분기. 스트리밍 청크를 onChunk로 전달. */
export async function streamChat(
  request: ChatRequest,
  options: StreamOptions,
): Promise<ChatRunResult> {
  const start = performance.now()
  let output = ''
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  let model = request.model
  const toolCalls: NonNullable<ChatResponseChunk['tool_calls']> = []

  const onChunk = (chunk: ChatResponseChunk) => {
    if (chunk.delta) output += chunk.delta
    if (chunk.usage) usage = chunk.usage
    if (chunk.model) model = chunk.model
    if (chunk.tool_calls) toolCalls.push(...chunk.tool_calls)
    options.onChunk(chunk)
  }

  switch (request.provider) {
    case 'github-models':
      await githubModels.streamChatCompletion(request, {
        apiKey: options.apiKey,
        signal: options.signal,
        onChunk,
      })
      break
    case 'openai':
    case 'azure':
    case 'huggingface':
      throw new Error(`'${request.provider}' provider는 아직 구현되지 않았습니다 (MVP는 github-models만).`)
  }

  const latencyMs = Math.round(performance.now() - start)
  return {
    output,
    usage,
    model,
    latencyMs,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  }
}
