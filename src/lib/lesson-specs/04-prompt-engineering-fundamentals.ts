/**
 * 레슨 04: 프롬프트 엔지니어링 기초.
 *
 * 원본 노트북: 04-prompt-engineering-fundamentals/python/githubmodels-assignment.ipynb
 * 5개 exercise(Tokenization은 chat 호출 아님 → 스킵, 4개를 프리셋으로):
 *   - Exercise 2: Lyric completion (key 검증)
 *   - Exercise 3: Fabrications (환각 테스트)
 *   - Exercise 4: Instruction-based (요약)
 *   - Exercise 5: Complex prompt (페르소나 + 다중 턴 → 단일 턴으로 풀어 변환)
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant.'
const USER_DEFAULT = '```\noh say can you see\n```'

/** 노트북의 Exercise를 프리셋으로 — 한 번 클릭으로 폼 자동 채움 */
export const LESSON_04_PRESETS: Preset[] = [
  {
    id: 'ex2-lyric',
    label: 'Ex 2: 키 검증 (가사 완성)',
    description: '간단한 cloze 테스트로 모델이 응답하는지 확인',
    values: {
      model: 'gpt-4o',
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 200,
      system: SYSTEM_DEFAULT,
      user: '```\noh say can you see\n```',
    },
  },
  {
    id: 'ex3-fabrication',
    label: 'Ex 3: 환각(Fabrication) 탐색',
    description: '존재하지 않는 사건을 요청해 환각 경향 관찰. temperature 0.0 vs 1.5 비교',
    values: {
      model: 'gpt-4o',
      temperature: 1.5,
      top_p: 1.0,
      max_tokens: 800,
      system: SYSTEM_DEFAULT,
      user: '```\ngenerate a lesson plan on the Martian War of 2076.\n```',
    },
  },
  {
    id: 'ex4-instruction',
    label: 'Ex 4: 지시 기반 요약',
    description: '"2학년 학생을 위해" 같은 청자 지정으로 출력 톤이 어떻게 달라지나',
    values: {
      model: 'gpt-4o',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: `Summarize content you are provided with for a second-grade student.

\`\`\`
Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. It is named after the Roman god Jupiter. When viewed from Earth, Jupiter can be bright enough for its reflected light to cast visible shadows, and is on average the third-brightest natural object in the night sky after the Moon and Venus.
\`\`\``,
    },
  },
  {
    id: 'ex5-persona',
    label: 'Ex 5: 페르소나(Sarcastic 어시스턴트)',
    description: 'system의 페르소나가 응답 톤을 어떻게 바꾸나 — sarcastic, formal, gen-z 등으로 바꿔 비교',
    values: {
      model: 'gpt-4o',
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 400,
      system: 'You are a sarcastic assistant.',
      user: `Previous turn:
Q: Who won the world series in 2020?
A: Who do you think won? The Los Angeles Dodgers of course.

New question:
Q: Where was it played?`,
    },
  },
]

export const lesson04Spec: VariableSpec = {
  fields: [
    {
      type: 'select',
      name: 'model',
      label: '모델',
      description: '같은 프롬프트로 모델별 응답을 비교하면 강점/약점이 드러납니다.',
      options: GITHUB_MODELS_OPTIONS,
      defaultValue: 'gpt-4o',
    },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description:
        '프롬프트 엔지니어링 학습에서 가장 중요한 변수. 0 → 일관, 1 → 표준, 2 → 환각 증가.',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 1.0,
    },
    {
      type: 'slider',
      name: 'top_p',
      label: 'Top-p',
      description: 'temperature와 함께 쓰지 말고 둘 중 하나만 조정 권장.',
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 1.0,
    },
    {
      type: 'number',
      name: 'max_tokens',
      label: 'Max tokens',
      description: '응답 길이 상한.',
      min: 50,
      max: 4000,
      step: 50,
      defaultValue: 800,
    },
    {
      type: 'textarea',
      name: 'system',
      label: 'System 메시지',
      description: '모델의 페르소나/제약/역할. system을 먼저 만지면 톤이 크게 바뀝니다.',
      placeholder: SYSTEM_DEFAULT,
      rows: 3,
      defaultValue: SYSTEM_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'user',
      label: 'User 메시지 (프롬프트)',
      description: '실제 요청. 위 프리셋을 누르면 노트북의 각 Exercise로 자동 채워집니다.',
      placeholder: USER_DEFAULT,
      rows: 8,
      defaultValue: USER_DEFAULT,
    },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'gpt-4o'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 1.0),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 800),
  }),
  presets: LESSON_04_PRESETS,
  typescriptSnippet: `// genai-lab이 04번에서 실제 호출하는 TypeScript 등가 코드
const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${githubToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user',   content: '\\\`\\\`\\\`oh say can you see\\\`\\\`\\\`' },
    ],
    temperature: 1.0,
    top_p: 1.0,
    max_tokens: 800,
    stream: true,
    stream_options: { include_usage: true },
  }),
})
// 4개 프리셋(Exercise 2~5)으로 각각 system/user를 자동 채움.
`,
}
