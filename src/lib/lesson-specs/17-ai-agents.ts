/**
 * 레슨 17: AI 에이전트 — function-call loop.
 *
 * 흐름:
 *   1) system + user로 chat (tools 포함)
 *   2) 모델이 tool_call 반환 → 클라이언트가 mock 도구 실행 → tool 결과를 history에 추가
 *   3) 다시 chat → ... 반복
 *   4) tool_call이 없으면 종료, 또는 maxIterations 도달
 *
 * 사용 가능한 mock 도구 (lib/llm/index.ts의 MOCK_TOOL_IMPLS):
 *   - calculator(expression)
 *   - current_time()
 *   - get_weather(city)
 *   - search_web(query)
 *
 * 모든 도구는 클라이언트에서 즉시 실행 — 실제 외부 호출 없음(get_weather/
 * search_web는 mock 데이터). 학습 흐름에 집중하기 위함.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { AgentRequest, ToolDefinition } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const ALL_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Evaluate a mathematical expression. Supports +, -, *, /, parentheses.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'A pure arithmetic expression like "2 + 3 * 4"' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'current_time',
      description: 'Get the current date and time (UTC).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a city. Returns mock data for learning purposes.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name like "Seoul" or "Tokyo"' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web. Returns mock results for learning purposes.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
]

const SYSTEM_DEFAULT =
  'You are a helpful assistant that can call tools to gather information before answering. When you have enough info, give a final answer in Korean. Use tools sparingly — call only what you need.'

export const LESSON_17_PRESETS: Preset[] = [
  {
    id: 'simple-math',
    label: '간단한 계산',
    description: 'calculator 한 번만 호출 — 가장 짧은 agent loop',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      maxIterations: 3,
      systemPreamble: SYSTEM_DEFAULT,
      query: '127 곱하기 89는 얼마야?',
      tools: JSON.stringify(ALL_TOOLS, null, 2),
    },
  },
  {
    id: 'multi-step',
    label: '다단계 추론',
    description: 'calculator + current_time 같이 사용 — agent가 도구를 조합해 답을 만드는지 관찰',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      maxIterations: 5,
      systemPreamble: SYSTEM_DEFAULT,
      query: '지금 시각 기준으로, 만약 오늘이 1년 365일짜리 해라면 올해는 몇 % 지나갔어?',
      tools: JSON.stringify(ALL_TOOLS, null, 2),
    },
  },
  {
    id: 'travel-plan',
    label: '여행 계획 (검색 + 날씨)',
    description: 'search_web + get_weather 조합 — 실제 에이전트 워크플로우와 가장 유사',
    values: {
      model: 'gpt-4o',
      temperature: 0.3,
      maxIterations: 5,
      systemPreamble: SYSTEM_DEFAULT,
      query: '이번 주말 도쿄 여행 가는데, 날씨 확인하고 비 오면 실내 명소 3개 추천해줘',
      tools: JSON.stringify(ALL_TOOLS, null, 2),
    },
  },
  {
    id: 'restricted-tools',
    label: '제한된 도구 세트',
    description: 'tools 필드를 calculator만 남기면 모델이 다른 도구를 못 씀 — 도구 가용성에 따른 행동 변화 관찰',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      maxIterations: 3,
      systemPreamble: SYSTEM_DEFAULT,
      query: '서울 날씨 어때? 그리고 100 더하기 200은?',
      tools: JSON.stringify([ALL_TOOLS[0]], null, 2),
    },
  },
]

export const lesson17Spec: VariableSpec = {
  kind: 'agent',
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'function calling 정확도가 중요. gpt-4o 권장', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o' },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description: '에이전트는 결정성 중요 — 0.0~0.3',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 0.0,
    },
    {
      type: 'number',
      name: 'maxIterations',
      label: 'Max iterations (반복 상한)',
      description: '안전장치 — 무한 도구 호출 루프 방지. 보통 5 이하면 충분.',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 5,
    },
    {
      type: 'textarea',
      name: 'systemPreamble',
      label: 'System 프리앰블',
      rows: 3,
      defaultValue: SYSTEM_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'query',
      label: '사용자 질문',
      placeholder: '에이전트에게 시킬 작업',
      rows: 3,
      defaultValue: '127 곱하기 89는 얼마야?',
    },
    {
      type: 'json',
      name: 'tools',
      label: '도구 정의 (JSON)',
      description:
        '사용 가능한 mock 도구: calculator, current_time, get_weather, search_web. 항목을 빼거나 추가해 행동을 바꿔보세요.',
      schemaHint: '[{ type:"function", function:{ name, description, parameters }}]',
      defaultValue: JSON.stringify(ALL_TOOLS, null, 2),
    },
  ],
  buildRequest: (values): AgentRequest => {
    let toolDefs: ToolDefinition[] = ALL_TOOLS
    try {
      const parsed = JSON.parse(String(values.tools ?? '[]'))
      if (Array.isArray(parsed) && parsed.length > 0) toolDefs = parsed
    } catch {
      // tools JSON 파싱 실패 — 기본 도구 세트 사용
    }
    return {
      provider: 'github-models',
      model: String(values.model ?? 'gpt-4o'),
      query: String(values.query ?? ''),
      systemPreamble: String(values.systemPreamble ?? SYSTEM_DEFAULT),
      toolDefinitions: toolDefs,
      maxIterations: Number(values.maxIterations ?? 5),
      temperature: Number(values.temperature ?? 0.0),
    }
  },
  presets: LESSON_17_PRESETS,
  typescriptSnippet: `// 17번 Agent loop — function calling을 직접 오케스트레이션

const messages = [
  { role: 'system', content: systemPreamble },
  { role: 'user', content: query },
]
const toolImpls = {
  calculator: ({ expression }) => String(eval(expression)),
  current_time: () => new Date().toISOString(),
  get_weather: ({ city }) => 'mock weather for ' + city,
  search_web: ({ query }) => 'mock search results for ' + query,
}

for (let i = 0; i < maxIterations; i++) {
  // 1) chat with tools
  const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: \`Bearer \${githubToken}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages, tools, tool_choice: 'auto' }),
  })
  const { choices: [{ message }] } = await response.json()

  // 2) 도구 호출이 없으면 종료
  if (!message.tool_calls || message.tool_calls.length === 0) {
    return message.content  // 최종 답변
  }

  // 3) 각 도구를 실행하고 history에 추가
  messages.push(message)
  for (const tc of message.tool_calls) {
    const args = JSON.parse(tc.function.arguments)
    const result = toolImpls[tc.function.name]?.(args) ?? 'unknown tool'
    messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
  }
  // 4) 다음 iteration으로
}
`,
}
