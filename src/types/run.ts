import type { Provider } from './llm'

export type Run = {
  id: string
  lessonId: string | 'playground'
  timestamp: number
  inputs: Record<string, unknown>
  output: string
  metadata: {
    provider: Provider
    model: string
    latencyMs: number
    promptTokens: number
    completionTokens: number
  }
  error?: string
}

export type ComparisonPair = {
  left: Run
  right: Run
}
