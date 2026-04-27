/**
 * RAG smoke test — lesson 15의 흐름이 end-to-end 동작하는지 검증.
 * 검색된 chunk + 답변이 모두 일관되게 나오는지 확인.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runRag } from '../src/lib/llm'

function loadToken(): string {
  const env = readFileSync(resolve('./.env'), 'utf-8')
  const tokenLine = env.split('\n').find((l) => l.startsWith('GITHUB_TOKEN='))
  return tokenLine?.split('=')[1].replace(/^['"]|['"]$/g, '') ?? ''
}

async function main() {
  const token = loadToken()
  if (!token) throw new Error('.env에 GITHUB_TOKEN이 없습니다')

  const corpus = [
    'GitHub Models는 학습/테스트용 무료 티어를 제공합니다. 분당/일당 요청 제한이 있고, 프로덕션에는 OpenAI나 Azure를 사용해야 합니다.',
    'temperature는 다음 토큰 확률 분포의 sharpness를 조정합니다. top_p는 누적 확률 임계값으로 후보를 제한합니다.',
    'RAG는 외부 지식을 검색해 프롬프트에 주입합니다. fine-tuning은 모델 가중치를 추가 학습합니다.',
    '환각(hallucination)은 temperature 낮추기, RAG로 외부 지식 주입, system 메시지에 "모르면 모른다고 답하라" 명시 등으로 줄일 수 있습니다.',
    'Function calling은 모델이 함수를 직접 실행하지 않고 호출 의도(이름+arguments)만 반환합니다.',
  ]

  console.log('=== RAG: query="환각이 일어나는데 어떻게 줄여요?" ===')
  process.stdout.write('streaming: ')
  const result = await runRag(
    {
      provider: 'github-models',
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o-mini',
      query: '환각이 자꾸 일어나는데 어떻게 줄일 수 있나요?',
      corpus,
      topK: 2,
      systemPreamble:
        '당신은 정확한 정보 전달을 우선시하는 한국어 어시스턴트입니다. 주어진 컨텍스트만 근거로 답하세요.',
      temperature: 0.3,
      max_tokens: 300,
    },
    {
      apiKey: token,
      onChunk: (delta) => process.stdout.write(delta),
    },
  )
  console.log('\n')

  console.log('--- 검증 ---')
  console.log(`총 latency: ${result.totalLatencyMs}ms`)
  console.log(`embed tokens: ${result.embedTokens}`)
  console.log(`chat: ${result.chatPromptTokens} → ${result.chatCompletionTokens}`)
  console.log(`embedding model: ${result.embeddingModel}`)
  console.log(`chat model: ${result.chatModel}`)
  console.log(`retrieved ${result.retrieved.length}개 chunks:`)
  for (const r of result.retrieved) {
    console.log(`  ${r.score.toFixed(3)}  ${r.text.slice(0, 60)}...`)
  }

  // 검증: top retrieved이 환각 관련 문장이어야 함
  const top = result.retrieved[0]
  const isHallucinationChunk = top.text.includes('환각') || top.text.includes('hallucination')
  console.log(`\n✅ top hit이 환각 관련 chunk?: ${isHallucinationChunk}`)
  console.log(`✅ 출력에 답변이 있나?: ${result.output.length > 20}`)
  if (!isHallucinationChunk) {
    console.error('❌ retrieval 품질 문제 — 환각 관련 chunk가 1위가 아님')
    process.exit(1)
  }
  if (result.output.length <= 20) {
    console.error('❌ 답변이 너무 짧거나 비어 있음')
    process.exit(1)
  }
  console.log('\n🎉 RAG 흐름 OK')
}

main().catch((err) => {
  console.error('smoke failed:', err)
  process.exit(1)
})
