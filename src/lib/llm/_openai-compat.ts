/**
 * OpenAI-compatible chat completions의 공통 SSE 파싱/요청 로직.
 * github-models, openai, azure가 모두 이 형식을 따른다 (페이로드/응답 동일).
 *
 * Provider별 차이점은 endpoint URL과 auth header뿐 — buildHeaders/endpoint를 주입.
 */

import { createParser, type EventSourceMessage } from 'eventsource-parser'
import type { ChatRequest, ChatResponseChunk } from '#/types/llm'

type CompatOptions = {
  endpoint: string
  buildHeaders: () => Record<string, string>
  apiKey: string
  signal?: AbortSignal
  onChunk: (chunk: ChatResponseChunk) => void
  /** 에러 시 throw할 때 사용할 wrapper. 없으면 일반 Error. */
  buildError?: (status: number, body: string, statusText: string) => Error
}

export async function streamOpenAiCompat(
  request: ChatRequest,
  options: CompatOptions,
): Promise<void> {
  const body = buildBody(request)

  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      ...options.buildHeaders(),
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      ...body,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    const text = await safeText(response)
    if (options.buildError) {
      throw options.buildError(response.status, text, response.statusText)
    }
    throw new Error(`${response.status} ${response.statusText}\n${text.slice(0, 500)}`)
  }
  if (!response.body) throw new Error('응답에 본문이 없습니다.')

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
        const delta = choice?.delta?.content ?? ''
        const toolCalls = choice?.delta?.tool_calls?.map((tc) => ({
          index: tc.index,
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
        if (!delta && !usage && !toolCalls && choice?.finish_reason == null) return
        options.onChunk({
          delta,
          done: choice?.finish_reason !== null && choice?.finish_reason !== undefined,
          model: json.model,
          usage,
          tool_calls: toolCalls,
        })
      } catch {
        // keepalive / 빈 줄 무시
      }
    },
  })

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    parser.feed(decoder.decode(value, { stream: true }))
  }
}

export async function callOpenAiCompat(
  request: ChatRequest,
  options: Omit<CompatOptions, 'onChunk'>,
): Promise<{
  output: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  model: string
}> {
  const body = buildBody(request)
  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      ...options.buildHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })
  if (!response.ok) {
    const text = await safeText(response)
    if (options.buildError) {
      throw options.buildError(response.status, text, response.statusText)
    }
    throw new Error(`${response.status} ${response.statusText}\n${text.slice(0, 500)}`)
  }
  const json = (await response.json()) as OpenAiCompletionsResponse
  const choice = json.choices?.[0]
  return {
    output: choice?.message?.content ?? '',
    usage: json.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    model: json.model ?? request.model,
  }
}

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
