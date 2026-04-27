export type Provider = 'github-models' | 'openai' | 'azure' | 'huggingface'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
  /**
   * assistant 메시지가 도구 호출을 했을 때 그 호출 정보를 같이 실어 보내야
   * 후속 'tool' role 메시지가 OpenAI/GitHub Models 검증을 통과한다.
   */
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters: Record<string, unknown>
  }
}

export type ChatRequest = {
  provider: Provider
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  n?: number
  tools?: ToolDefinition[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  stream?: boolean
  /** Free-form, provider-specific extras passed through. */
  extra?: Record<string, unknown>
}

export type ChatResponseChunk = {
  delta: string
  done: boolean
  /** Final usage info, only present on the last chunk. */
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  /** Model echoed back from the server (some providers normalize). */
  model?: string
  /**
   * Function/tool call info if the model invoked a tool.
   * Streaming 시 한 호출이 여러 청크로 쪼개져 옴 — `index`가 동일하면 같은 호출.
   * `id`/`name`은 첫 청크에만, `arguments`는 fragmented 누적 필요.
   */
  tool_calls?: Array<{
    index: number
    id: string
    name: string
    arguments: string
  }>
}

export type ChatRunResult = {
  output: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  latencyMs: number
  toolCalls?: Array<{
    id: string
    name: string
    arguments: string
  }>
}

// ── Embeddings & Search ──────────────────────────────────────

export type EmbeddingRequest = {
  provider: Provider
  model: string
  input: string | string[]
}

export type EmbeddingResult = {
  embeddings: number[][]
  model: string
  usage: { prompt_tokens: number; total_tokens: number }
  latencyMs: number
}

/** 단일 corpus item과 그 query 대비 유사도 점수. */
export type SearchHit = {
  index: number
  text: string
  score: number
}

export type SearchResult = {
  query: string
  hits: SearchHit[]
  embeddingModel: string
  latencyMs: number
  totalTokens: number
}

/** Semantic search 요청 — query + corpus를 한 번에 임베딩 + 정렬. */
export type SearchRequest = {
  provider: 'github-models'
  model: string
  query: string
  corpus: string[]
  topK: number
}

// ── RAG ──────────────────────────────────────

export type RagRequest = {
  provider: 'github-models'
  embeddingModel: string
  chatModel: string
  query: string
  corpus: string[]
  topK: number
  systemPreamble: string
  temperature: number
  max_tokens: number
}

export type RagResult = {
  retrieved: SearchHit[]
  output: string
  embeddingModel: string
  chatModel: string
  totalLatencyMs: number
  embedTokens: number
  chatPromptTokens: number
  chatCompletionTokens: number
}

// ── Agent (function-call loop) ──────────────────────────────

export type AgentRequest = {
  provider: 'github-models'
  model: string
  query: string
  systemPreamble: string
  /** tool 이름 → JS 함수. 클라이언트에서 즉시 실행. */
  toolDefinitions: ToolDefinition[]
  maxIterations: number
  temperature: number
}

export type AgentStep = {
  iteration: number
  /** 모델이 한 발화 — 텍스트(있으면)와 호출 요청한 도구들 */
  assistantContent: string
  toolCalls: Array<{ id: string; name: string; arguments: string }>
  /** 우리가 실행한 도구 결과 (toolCalls 순서와 매칭) */
  toolResults: Array<{ name: string; result: string }>
}

export type AgentResult = {
  steps: AgentStep[]
  /** 마지막 assistant 응답 (모든 도구 호출이 끝난 후) */
  finalAnswer: string
  iterationsUsed: number
  totalLatencyMs: number
  model: string
}
