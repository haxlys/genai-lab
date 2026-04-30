/**
 * Provider-agnostic LLM 어댑터.
 * Chat completions: github-models / openai / azure (모두 OpenAI-compatible).
 * Image generation: openai-image.
 * Embeddings/search: github-models-embedding.
 */

import * as githubModels from './github-models'
import * as openaiChat from './openai-chat'
import * as azureChat from './azure-chat'
import { generateImageOpenAi } from './openai-image'
import { cosineSimilarity, createEmbeddings } from './github-models-embedding'
import { getSettings } from '#/lib/storage/settings'
import type {
  AgentRequest,
  AgentResult,
  AgentStep,
  ChatRequest,
  ChatMessage,
  ChatResponseChunk,
  ChatRunResult,
  EmbeddingRequest,
  EmbeddingResult,
  RagRequest,
  RagResult,
  SearchHit,
  SearchResult,
} from '#/types/llm'
import type { ImageRequest, ImageResult } from '#/types/image'

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
  // streaming tool_calls는 index별로 fragments가 쪼개져서 옴 — index를 키로 누적
  const callsByIndex: Map<number, { id: string; name: string; arguments: string }> = new Map()

  const onChunk = (chunk: ChatResponseChunk) => {
    if (chunk.delta) output += chunk.delta
    if (chunk.usage) usage = chunk.usage
    if (chunk.model) model = chunk.model
    if (chunk.tool_calls) {
      for (const tc of chunk.tool_calls) {
        const existing = callsByIndex.get(tc.index)
        if (existing) {
          if (tc.id && !existing.id) existing.id = tc.id
          if (tc.name && !existing.name) existing.name = tc.name
          existing.arguments += tc.arguments
        } else {
          callsByIndex.set(tc.index, {
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
          })
        }
      }
    }
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
      await openaiChat.streamChatCompletion(request, {
        apiKey: options.apiKey,
        signal: options.signal,
        onChunk,
      })
      break
    case 'azure': {
      const settings = getSettings()
      await azureChat.streamChatCompletion(request, {
        apiKey: options.apiKey,
        endpoint: settings.apiKeys.azureEndpoint,
        deployment: settings.apiKeys.azureDeployment,
        signal: options.signal,
        onChunk,
      })
      break
    }
    case 'huggingface':
      throw new Error(`'huggingface' provider chat completions는 아직 구현되지 않았습니다.`)
  }

  // index 순으로 정렬해 최종 toolCalls 배열 (동일 호출의 fragments는 모두 누적됨)
  const toolCalls = [...callsByIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => v)

  const latencyMs = Math.round(performance.now() - start)
  return {
    output,
    usage,
    model,
    latencyMs,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  }
}

/** 이미지 생성 — 현재 OpenAI direct만 지원. azure는 v2. */
export async function generateImage(
  request: ImageRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<ImageResult> {
  switch (request.provider) {
    case 'openai':
      return generateImageOpenAi(request, options)
    case 'azure':
      throw new Error('Azure 이미지 생성은 아직 구현되지 않았습니다.')
  }
}

/** 임베딩 생성 — github-models 우선. */
export async function generateEmbeddings(
  request: EmbeddingRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<EmbeddingResult> {
  switch (request.provider) {
    case 'github-models':
      return createEmbeddings(request, options)
    default:
      throw new Error(`'${request.provider}' embedding provider는 아직 구현되지 않았습니다.`)
  }
}

/**
 * Semantic search — query를 한 번, corpus를 한 번 임베딩해서 코사인 유사도로 정렬.
 * GitHub Models는 input에 배열을 허용하므로 corpus 전체를 한 번의 호출로 처리.
 */
export async function runEmbeddingSearch(
  options: {
    apiKey: string
    signal?: AbortSignal
    model: string
    query: string
    corpus: string[]
    topK: number
  },
): Promise<SearchResult> {
  const start = performance.now()
  const result = await createEmbeddings(
    {
      provider: 'github-models',
      model: options.model,
      input: [options.query, ...options.corpus],
    },
    { apiKey: options.apiKey, signal: options.signal },
  )
  const [queryEmb, ...docEmbs] = result.embeddings
  const hits: SearchHit[] = docEmbs
    .map((doc, i) => ({
      index: i,
      text: options.corpus[i],
      score: cosineSimilarity(queryEmb, doc),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.topK)
  return {
    query: options.query,
    hits,
    embeddingModel: result.model,
    latencyMs: Math.round(performance.now() - start),
    totalTokens: result.usage.total_tokens,
  }
}

/**
 * RAG: query → embed query+corpus → top-k 검색 → context로 chat 호출 → 응답.
 */
export async function runRag(
  request: RagRequest,
  options: { apiKey: string; signal?: AbortSignal; onChunk?: (delta: string) => void },
): Promise<RagResult> {
  const start = performance.now()

  // 1) 임베딩 + top-k 검색
  const search = await runEmbeddingSearch({
    apiKey: options.apiKey,
    signal: options.signal,
    model: request.embeddingModel,
    query: request.query,
    corpus: request.corpus,
    topK: request.topK,
  })

  // 2) 검색된 chunk들을 시스템 프롬프트에 주입
  const contextBlock = search.hits
    .map((h, i) => `[${i + 1}] ${h.text}`)
    .join('\n\n')
  const systemMessage = `${request.systemPreamble}

당신에게 다음 컨텍스트가 주어졌습니다. 이 안의 정보만으로 답하고, 없는 정보면 모른다고 정직하게 답하세요.

──── 컨텍스트 ────
${contextBlock}
──────────────────`

  // 3) chat 호출 (streaming)
  let chatOutput = ''
  let chatPromptTokens = 0
  let chatCompletionTokens = 0
  let chatModel = request.chatModel
  await githubModels.streamChatCompletion(
    {
      provider: 'github-models',
      model: request.chatModel,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: request.query },
      ],
      temperature: request.temperature,
      max_tokens: request.max_tokens,
    },
    {
      apiKey: options.apiKey,
      signal: options.signal,
      onChunk: (chunk) => {
        if (chunk.delta) {
          chatOutput += chunk.delta
          options.onChunk?.(chunk.delta)
        }
        if (chunk.usage) {
          chatPromptTokens = chunk.usage.prompt_tokens
          chatCompletionTokens = chunk.usage.completion_tokens
        }
        if (chunk.model) chatModel = chunk.model
      },
    },
  )

  return {
    retrieved: search.hits,
    output: chatOutput,
    embeddingModel: search.embeddingModel,
    chatModel,
    totalLatencyMs: Math.round(performance.now() - start),
    embedTokens: search.totalTokens,
    chatPromptTokens,
    chatCompletionTokens,
  }
}

// ── Agent: function-call loop with built-in mock tools ────────────────────

/** 클라이언트에서 즉시 실행하는 mock tool 구현체. */
const MOCK_TOOL_IMPLS: Record<string, (args: Record<string, unknown>) => string> = {
  calculator: (args) => {
    const expr = String(args.expression ?? '')
    // 매우 제한된 안전 평가: 숫자, 연산자, 괄호, 공백만 허용
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
      return `error: invalid expression "${expr}"`
    }
    try {
      // eslint-disable-next-line no-new-func
      const value = new Function(`"use strict"; return (${expr});`)()
      return String(value)
    } catch (e) {
      return `error: ${(e as Error).message}`
    }
  },
  current_time: () => {
    const now = new Date()
    return now.toISOString() + ' (UTC, ' + now.toString() + ')'
  },
  get_weather: (args) => {
    const city = String(args.city ?? 'Seoul')
    // mock — 실제 API 미사용. 학습 흐름에 집중.
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy']
    const temp = Math.floor(Math.random() * 30) - 5
    const cond = conditions[Math.floor(Math.random() * conditions.length)]
    return JSON.stringify({ city, temp_c: temp, condition: cond, source: 'mock' })
  },
  search_web: (args) => {
    // mock 검색 결과
    const q = String(args.query ?? '')
    return JSON.stringify({
      query: q,
      results: [
        { title: `Mock result 1 for "${q}"`, snippet: 'Lorem ipsum dolor sit amet.' },
        { title: `Mock result 2 for "${q}"`, snippet: 'Consectetur adipiscing elit.' },
      ],
      note: 'mock — 실제 검색 아님',
    })
  },
}

/**
 * Agent loop:
 *   1. system + user 메시지로 chat (tools 포함)
 *   2. 응답에 tool_calls가 있으면 → 클라이언트에서 mock 실행 → tool 메시지로 추가
 *   3. 다시 chat → 반복
 *   4. tool_calls 없으면 종료, 또는 maxIterations 도달
 */
export async function runAgent(
  request: AgentRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<AgentResult> {
  const start = performance.now()
  const messages: ChatMessage[] = [
    { role: 'system', content: request.systemPreamble },
    { role: 'user', content: request.query },
  ]
  const steps: AgentStep[] = []
  let model = request.model
  let finalAnswer = ''

  for (let i = 0; i < request.maxIterations; i++) {
    let textChunks = ''
    // streaming 동안 index별로 누적 — id/name은 첫 청크에만 있고 arguments는 fragmented
    const callsByIndex: Map<number, { id: string; name: string; arguments: string }> = new Map()

    await githubModels.streamChatCompletion(
      {
        provider: 'github-models',
        model: request.model,
        messages,
        temperature: request.temperature,
        tools: request.toolDefinitions,
        tool_choice: 'auto',
      },
      {
        apiKey: options.apiKey,
        signal: options.signal,
        onChunk: (chunk) => {
          if (chunk.delta) textChunks += chunk.delta
          if (chunk.tool_calls) {
            for (const tc of chunk.tool_calls) {
              const existing = callsByIndex.get(tc.index)
              if (existing) {
                if (tc.id && !existing.id) existing.id = tc.id
                if (tc.name && !existing.name) existing.name = tc.name
                existing.arguments += tc.arguments
              } else {
                callsByIndex.set(tc.index, {
                  id: tc.id,
                  name: tc.name,
                  arguments: tc.arguments,
                })
              }
            }
          }
          if (chunk.model) model = chunk.model
        },
      },
    )

    // index 순으로 정렬해서 toolCalls 배열로 변환
    const toolCalls: AgentStep['toolCalls'] = [...callsByIndex.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v)

    // 도구 호출이 없으면 최종 답변
    if (toolCalls.length === 0) {
      finalAnswer = textChunks
      steps.push({
        iteration: i + 1,
        assistantContent: textChunks,
        toolCalls: [],
        toolResults: [],
      })
      break
    }

    // 도구 실행
    const toolResults: AgentStep['toolResults'] = []
    const toolMessages: ChatMessage[] = []
    for (const tc of toolCalls) {
      const impl = MOCK_TOOL_IMPLS[tc.name]
      let result: string
      if (!impl) {
        result = `error: tool "${tc.name}" not implemented`
      } else {
        try {
          const args = tc.arguments ? JSON.parse(tc.arguments) : {}
          result = impl(args)
        } catch (e) {
          result = `error parsing args: ${(e as Error).message}`
        }
      }
      toolResults.push({ name: tc.name, result })
      toolMessages.push({
        role: 'tool',
        content: result,
        tool_call_id: tc.id,
      })
    }

    steps.push({
      iteration: i + 1,
      assistantContent: textChunks,
      toolCalls,
      toolResults,
    })

    // assistant 메시지에 tool_calls를 함께 실어야 — 그래야 다음 'tool' role 메시지가
    // OpenAI/GitHub Models의 검증을 통과 ("messages with role 'tool' must be a response
    // to a preceding message with tool_calls").
    messages.push({
      role: 'assistant',
      content: textChunks,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    })
    messages.push(...toolMessages)
  }

  // maxIterations 도달했는데도 finalAnswer가 비어 있으면 마지막 step의 텍스트 사용
  if (!finalAnswer && steps.length > 0) {
    finalAnswer = steps[steps.length - 1].assistantContent || '(최대 반복 횟수에 도달했지만 모델이 최종 답변을 내지 못했습니다)'
  }

  return {
    steps,
    finalAnswer,
    iterationsUsed: steps.length,
    totalLatencyMs: Math.round(performance.now() - start),
    model,
  }
}
