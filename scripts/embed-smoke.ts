/**
 * 임베딩 검색 smoke test — 실제 GitHub Models 호출로 lesson 08의 흐름 검증.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runEmbeddingSearch } from '../src/lib/llm'

function loadToken(): string {
  const env = readFileSync(resolve('./.env'), 'utf-8')
  const tokenLine = env.split('\n').find((l) => l.startsWith('GITHUB_TOKEN='))
  return tokenLine?.split('=')[1].replace(/^['"]|['"]$/g, '') ?? ''
}

async function main() {
  const token = loadToken()
  if (!token) throw new Error('.env에 GITHUB_TOKEN이 없습니다')

  const corpus = [
    'Use lower temperature settings for factual answers.',
    'DALL-E generates images from text prompts.',
    'RAG retrieves external knowledge to ground LLM responses.',
    'Phi-3 is a small language model from Microsoft.',
    'Telling the model to say "I do not know" when uncertain helps reduce hallucinations.',
  ]

  const result = await runEmbeddingSearch({
    apiKey: token,
    model: 'text-embedding-3-small',
    query: 'How do I avoid hallucinations?',
    corpus,
    topK: 3,
  })

  console.log(`latency: ${result.latencyMs}ms`)
  console.log(`embedTokens: ${result.totalTokens}`)
  console.log('top hits:')
  for (const h of result.hits) {
    console.log(`  ${h.score.toFixed(3)}  ${h.text}`)
  }
}

main().catch((err) => {
  console.error('smoke failed:', err)
  process.exit(1)
})
