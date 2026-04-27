/**
 * Agent smoke test — lesson 17의 ReAct loop가 동작하는지 검증.
 * calculator 도구를 호출하고 결과를 받아 다음 응답을 만드는지 확인.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runAgent } from '../src/lib/llm'
import type { ToolDefinition } from '../src/types/llm'

function loadToken(): string {
  const env = readFileSync(resolve('./.env'), 'utf-8')
  const tokenLine = env.split('\n').find((l) => l.startsWith('GITHUB_TOKEN='))
  return tokenLine?.split('=')[1].replace(/^['"]|['"]$/g, '') ?? ''
}

const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Evaluate an arithmetic expression like "2 + 3 * 4".',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'current_time',
      description: 'Get the current date and time.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

async function main() {
  const token = loadToken()
  if (!token) throw new Error('.env에 GITHUB_TOKEN이 없습니다')

  console.log('=== Agent test 1: simple calculation ===')
  const result1 = await runAgent(
    {
      provider: 'github-models',
      model: 'gpt-4o',
      query: '127 곱하기 89는 얼마야?',
      systemPreamble:
        'You are a helpful assistant. Use tools when needed and give a final answer in Korean.',
      toolDefinitions: TOOLS,
      maxIterations: 3,
      temperature: 0.0,
    },
    { apiKey: token },
  )

  console.log(`iterations: ${result1.iterationsUsed}, latency: ${result1.totalLatencyMs}ms`)
  for (const step of result1.steps) {
    console.log(`  step ${step.iteration}: ${step.toolCalls.length} tool call(s)`)
    for (const tc of step.toolCalls) {
      console.log(`    → ${tc.name}(${tc.arguments})`)
    }
    for (const r of step.toolResults) {
      console.log(`    ← ${r.name}: ${r.result}`)
    }
  }
  console.log('final:', result1.finalAnswer.slice(0, 200))

  // 검증: calculator가 호출되어야 하고 결과에 11303 (127*89)이 들어가야 함
  const usedCalculator = result1.steps.some((s) =>
    s.toolCalls.some((tc) => tc.name === 'calculator'),
  )
  const calcResult = result1.steps.flatMap((s) => s.toolResults).find((r) => r.name === 'calculator')
  const correctAnswer = result1.finalAnswer.includes('11303') || (calcResult?.result === '11303')

  console.log(`\n✅ calculator 호출됨?: ${usedCalculator}`)
  console.log(`✅ 정답(11303) 응답에 포함?: ${correctAnswer}`)
  if (!usedCalculator) {
    console.error('❌ calculator 도구가 호출되지 않음 — function calling 실패')
    process.exit(1)
  }
  if (!correctAnswer) {
    console.error('❌ 11303이 결과/답변에 없음 — tool 결과 처리 실패 또는 모델이 잘못 계산')
    process.exit(1)
  }

  console.log('\n=== Agent test 2: 도구 없이 답할 수 있는 질문 ===')
  const result2 = await runAgent(
    {
      provider: 'github-models',
      model: 'gpt-4o',
      query: '한국의 수도가 어디야? 한 단어로만 답해.',
      systemPreamble: 'You are a helpful assistant. Use tools only when needed.',
      toolDefinitions: TOOLS,
      maxIterations: 3,
      temperature: 0.0,
    },
    { apiKey: token },
  )

  const noToolsCalled = result2.steps.every((s) => s.toolCalls.length === 0)
  console.log(`iterations: ${result2.iterationsUsed}, no tools called: ${noToolsCalled}`)
  console.log('final:', result2.finalAnswer)
  console.log(`\n✅ 도구 호출 안 함?: ${noToolsCalled}`)
  console.log(`✅ "서울" 포함?: ${result2.finalAnswer.includes('서울') || result2.finalAnswer.toLowerCase().includes('seoul')}`)

  console.log('\n🎉 Agent 흐름 OK')
}

main().catch((err) => {
  console.error('smoke failed:', err)
  process.exit(1)
})
