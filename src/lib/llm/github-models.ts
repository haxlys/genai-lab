/**
 * GitHub Models 어댑터 — fine-grained PAT를 사용해 https://models.inference.ai.azure.com
 * 의 chat completions 엔드포인트를 직접 호출. SSE 스트리밍 지원.
 *
 * 사용자 토큰은 브라우저에서만 사용되고 서버로 프록시되지 않는다(BYOK).
 */

import { createParser, type EventSourceMessage } from 'eventsource-parser'
import type { ChatRequest, ChatResponseChunk } from '#/types/llm'

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions'

export type StreamingOptions = {
  apiKey: string
  signal?: AbortSignal
  onChunk: (chunk: ChatResponseChunk) => void
}

/**
 * Chat completions 요청을 GitHub Models로 전송, SSE 스트리밍 청크를 onChunk로 전달.
 * Promise는 스트림이 완전히 끝났을 때 resolve.
 */
export async function streamChatCompletion(
  request: ChatRequest,
  options: StreamingOptions,
): Promise<void> {
  if (!options.apiKey) {
    throw new Error('GitHub Models PAT이 설정되지 않았습니다. Settings 페이지에서 입력하세요.')
  }

  const body = buildBody(request)

  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      ...body,
      stream: true,
      // 마지막 청크에 prompt_tokens/completion_tokens를 포함시킴
      stream_options: { include_usage: true },
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    const text = await safeText(response)
    throw new Error(
      `GitHub Models ${response.status}: ${response.statusText}\n${text.slice(0, 500)}`,
    )
  }
  if (!response.body) {
    throw new Error('GitHub Models 응답에 본문이 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  const parser = createParser({
    onEvent(event: EventSourceMessage) {
      if (event.data === '[DONE]') {
        options.onChunk({ delta: '', done: true })
        return
      }
      try {
        const json = JSON.parse(event.data) as OpenAiSseChunk
        const choice = json.choices?.[0]
        // include_usage 청크는 choices가 빈 배열이지만 usage가 채워져 있다 — 그것도 통과시켜야 함
        const delta = choice?.delta?.content ?? ''
        const toolCalls = choice?.delta?.tool_calls?.map((tc) => ({
          id: tc.id ?? '',
          name: tc.function?.name ?? '',
          arguments: tc.function?.arguments ?? '',
        }))
        const usage = json.usage
          ? {
              prompt_tokens: json.usage.prompt_tokens,
              completion_tokens: json.usage.completion_tokens,
              total_tokens: json.usage.total_tokens,
            }
          : undefined
        // delta도 없고 usage도 없는 청크는 keepalive — skip
        if (!delta && !usage && !toolCalls && choice?.finish_reason == null) return
        options.onChunk({
          delta,
          done: choice?.finish_reason !== null && choice?.finish_reason !== undefined,
          model: json.model,
          usage,
          tool_calls: toolCalls,
        })
      } catch {
        // SSE에서 가끔 빈 라인 또는 keepalive가 올 수 있음. 무시.
      }
    },
  })

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    parser.feed(decoder.decode(value, { stream: true }))
  }
}

/** Non-streaming 변형 — 한 번에 전체 응답을 가져온다. tool_choice 등 일부 흐름에서 유용. */
export async function chatCompletion(
  request: ChatRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<{
  output: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  model: string
}> {
  if (!options.apiKey) {
    throw new Error('GitHub Models PAT이 설정되지 않았습니다.')
  }
  const body = buildBody(request)
  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })
  if (!response.ok) {
    const text = await safeText(response)
    throw new Error(`GitHub Models ${response.status}: ${response.statusText}\n${text.slice(0, 500)}`)
  }
  const json = (await response.json()) as OpenAiCompletionsResponse
  const choice = json.choices?.[0]
  return {
    output: choice?.message?.content ?? '',
    usage: json.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    model: json.model ?? request.model,
  }
}

// ---- 내부 ----

function buildBody(request: ChatRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
  }
  if (request.temperature !== undefined) body.temperature = request.temperature
  if (request.top_p !== undefined) body.top_p = request.top_p
  if (request.max_tokens !== undefined) body.max_tokens = request.max_tokens
  if (request.n !== undefined) body.n = request.n
  if (request.tools && request.tools.length > 0) body.tools = request.tools
  if (request.tool_choice !== undefined) body.tool_choice = request.tool_choice
  if (request.extra) Object.assign(body, request.extra)
  return body
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

// ---- OpenAI/GitHub Models SSE 청크 형식 ----

type OpenAiSseChunk = {
  id?: string
  object?: string
  model?: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

type OpenAiCompletionsResponse = {
  id?: string
  model?: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
