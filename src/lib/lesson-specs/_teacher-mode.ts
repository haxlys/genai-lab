/**
 * 8개 Learn 레슨(00, 01, 02, 03, 12, 13, 14, 18)에 공통으로 적용하는 "교사 모드" spec 빌더.
 *
 * 각 레슨의 핵심 개념에 대해 한국어 튜터로 응답. 사용자가 자유 질문 또는
 * 프리셋(레슨 핵심 개념 3-4개)으로 즉시 추가 설명을 받는다.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const TUTOR_SYSTEM = (lessonContext: string) =>
  `당신은 "Generative AI for Beginners" 코스의 한국어 튜터입니다.\n` +
  `현재 학습자는 ${lessonContext} 레슨을 보고 있습니다.\n` +
  `\n` +
  `답변 원칙:\n` +
  `- 항상 한국어로 답변\n` +
  `- 비유와 구체적 예시 사용\n` +
  `- 학습자가 이해하기 어려워하면 더 쉽게 다시 설명\n` +
  `- 코드/명령어 예시는 짧고 실행 가능하게\n` +
  `- 답변 길이: 짧을 때는 1-2문단, 자세히 설명할 때는 단계별 목록`

export function buildTeacherSpec(opts: {
  /** 어떤 레슨인지를 system 프롬프트에 명시 */
  lessonContext: string
  /** 좌측 본문에서 자주 나오는 핵심 개념 질문 3-4개 */
  presets: Array<{ id: string; label: string; question: string; description?: string }>
  /** 시작할 때 입력란에 미리 채워진 user 메시지(첫 번째 preset 질문이 기본값) */
  defaultUser?: string
}): VariableSpec {
  const defaultUser = opts.defaultUser ?? opts.presets[0]?.question ?? ''

  const presetList: Preset[] = opts.presets.map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    values: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 800,
      user: p.question,
    },
  }))

  return {
    fields: [
      {
        type: 'select',
        name: 'model',
        label: '모델',
        description: '비교: gpt-4o-mini(빠름) vs gpt-4o(상세) vs Llama 70B(긴 답변).',
        options: GITHUB_MODELS_OPTIONS,
        defaultValue: 'gpt-4o-mini',
      },
      {
        type: 'slider',
        name: 'temperature',
        label: 'Temperature',
        description: '0.7 권장. 낮추면 정확/일관, 높이면 다양/창의.',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.7,
      },
      {
        type: 'number',
        name: 'max_tokens',
        label: 'Max tokens',
        description: '답변 길이 상한. 길게 듣고 싶으면 1500+',
        min: 100,
        max: 4000,
        step: 100,
        defaultValue: 800,
      },
      {
        type: 'textarea',
        name: 'user',
        label: '질문',
        description:
          '레슨 본문 중 이해 안 되는 부분을 자유롭게 물어보세요. 위 프리셋을 누르면 핵심 개념 질문이 자동 채워집니다.',
        rows: 4,
        defaultValue: defaultUser,
      },
    ],
    buildRequest: (values): ChatRequest => ({
      provider: 'github-models',
      model: String(values.model ?? 'gpt-4o-mini'),
      messages: [
        { role: 'system', content: TUTOR_SYSTEM(opts.lessonContext) },
        { role: 'user', content: String(values.user ?? defaultUser) },
      ],
      temperature: Number(values.temperature ?? 0.7),
      max_tokens: Number(values.max_tokens ?? 800),
    }),
    presets: presetList,
    typescriptSnippet: `// 교사 모드 — 레슨 핵심 개념을 한국어 튜터에게 즉시 묻기
const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${githubToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '/* 한국어 튜터 페르소나 */' },
      { role: 'user',   content: '/* 레슨 개념 질문 */' },
    ],
    temperature: 0.7,
    max_tokens: 800,
    stream: true,
    stream_options: { include_usage: true },
  }),
})
`,
  }
}
