/**
 * Smoke test — RunPanel이 실제로 클라이언트에서 하는 일을 Node에서 그대로 시뮬레이션.
 * .env에서 GITHUB_TOKEN을 읽어 SSE 스트리밍으로 토큰 단위 응답을 출력한다.
 *
 * 실행: pnpm tsx scripts/smoke-test.ts
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { streamChat } from '../src/lib/llm'
import { lesson06Spec } from '../src/lib/lesson-specs/06-text-generation-apps'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 단순 .env 파서 (dotenv 의존성 없이)
function loadEnv(path: string): Record<string, string> {
  try {
    const text = readFileSync(path, 'utf-8')
    const result: Record<string, string> = {}
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) {
        result[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
      }
    }
    return result
  } catch {
    return {}
  }
}

async function main() {
  const env = loadEnv(resolve(__dirname, '../.env'))
  const token = env.GITHUB_TOKEN
  if (!token) {
    console.error('❌ .env의 GITHUB_TOKEN이 비어있습니다.')
    process.exit(1)
  }
  console.log(`🔑 Token loaded (length=${token.length})`)

  // RunPanel이 사용하는 buildRequest와 동일한 흐름 — 기본값으로 호출
  const defaults: Record<string, unknown> = {}
  for (const f of lesson06Spec.fields) defaults[f.name] = f.defaultValue
  // 빠른 테스트를 위해 짧은 응답으로
  defaults.max_tokens = 60
  defaults.temperature = 0.2
  defaults.user = 'Show me 2 simple recipes with chicken. Just titles, no details.'

  const request = lesson06Spec.buildRequest(defaults)
  // lesson06은 kind='chat'(default)이므로 ChatRequest 형태. 좁혀서 사용.
  if (!('messages' in request)) {
    throw new Error('smoke-test expects a chat spec')
  }
  console.log(`📨 Model: ${request.model}, temp: ${request.temperature}, max_tokens: ${request.max_tokens}`)
  console.log(`💬 Prompt: "${(request.messages[1].content as string).slice(0, 80)}..."`)
  console.log('')
  console.log('--- streaming response ---')
  process.stdout.write('  ')

  let chunkCount = 0
  const result = await streamChat(request, {
    apiKey: token,
    onChunk: (chunk) => {
      if (chunk.delta) {
        process.stdout.write(chunk.delta)
        chunkCount += 1
      }
    },
  })

  console.log('\n--- end ---')
  console.log('')
  console.log(`✅ 완료`)
  console.log(`   streaming chunks: ${chunkCount}`)
  console.log(`   model echoed back: ${result.model}`)
  console.log(`   latency: ${result.latencyMs}ms`)
  console.log(`   usage: ${result.usage.prompt_tokens} → ${result.usage.completion_tokens} (total ${result.usage.total_tokens})`)
}

main().catch((err) => {
  console.error('💥 smoke test failed:')
  console.error(err)
  process.exit(1)
})
