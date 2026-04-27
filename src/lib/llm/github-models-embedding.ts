/**
 * GitHub Models embeddings 어댑터.
 * 호출: POST https://models.inference.ai.azure.com/embeddings
 * 모델: text-embedding-3-small (1536 dim) / text-embedding-3-large (3072 dim)
 */

import type { EmbeddingRequest, EmbeddingResult } from '#/types/llm'

const ENDPOINT = 'https://models.inference.ai.azure.com/embeddings'

export async function createEmbeddings(
  request: EmbeddingRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<EmbeddingResult> {
  if (!options.apiKey) {
    throw new Error('GitHub Models PAT이 설정되지 않았습니다.')
  }
  const start = performance.now()
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: request.model, input: request.input }),
    signal: options.signal,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`GitHub Models embeddings ${response.status}: ${text.slice(0, 500)}`)
  }
  const json = (await response.json()) as {
    data: Array<{ index: number; embedding: number[] }>
    model: string
    usage: { prompt_tokens: number; total_tokens: number }
  }
  const sorted = [...json.data].sort((a, b) => a.index - b.index)
  return {
    embeddings: sorted.map((d) => d.embedding),
    model: json.model,
    usage: json.usage,
    latencyMs: Math.round(performance.now() - start),
  }
}

/** 코사인 유사도 — [-1, 1] 범위. 같은 방향이면 1에 가까움. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`embedding 차원 불일치: ${a.length} vs ${b.length}`)
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
