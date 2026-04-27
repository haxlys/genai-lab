export type Provider = 'github-models' | 'openai' | 'azure' | 'huggingface'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
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
  /** Function/tool call info if the model invoked a tool. */
  tool_calls?: Array<{
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
