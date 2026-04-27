/**
 * Playground spec — 레슨에 종속되지 않은 자유 실험 폼.
 * 같은 변수 구조이지만 기본값이 일반적이고, 모델 선택 자유도 최대.
 */

import type { VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant. Respond in the language of the user.'
const USER_DEFAULT = '안녕하세요! 자기소개를 한국어로 한 문장으로 해주세요.'

export const playgroundSpec: VariableSpec = {
  fields: [
    {
      type: 'select',
      name: 'model',
      label: '모델',
      description: '같은 프롬프트로 모델별 응답을 비교해보세요.',
      options: GITHUB_MODELS_OPTIONS,
      defaultValue: 'gpt-4o-mini',
    },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description: '0 = 결정적 / 1 = 균형 / 2 = 매우 창의적',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 0.7,
    },
    {
      type: 'slider',
      name: 'top_p',
      label: 'Top-p',
      description: 'temperature와 함께 쓰지 말고 둘 중 하나만 조정 권장',
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 1.0,
    },
    {
      type: 'number',
      name: 'max_tokens',
      label: 'Max tokens',
      description: '응답의 최대 토큰 수',
      min: 50,
      max: 4000,
      step: 50,
      defaultValue: 800,
    },
    {
      type: 'textarea',
      name: 'system',
      label: 'System 메시지',
      description: '어시스턴트 페르소나/제약',
      placeholder: SYSTEM_DEFAULT,
      rows: 3,
      defaultValue: SYSTEM_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'user',
      label: 'User 메시지',
      description: '실제 요청',
      placeholder: USER_DEFAULT,
      rows: 6,
      defaultValue: USER_DEFAULT,
    },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'gpt-4o-mini'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.7),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 800),
  }),
}

/** Playground 프리셋 — 시나리오별 빠른 시작 */
export const PLAYGROUND_PRESETS: Array<{
  id: string
  label: string
  description: string
  values: Record<string, unknown>
}> = [
  {
    id: 'default',
    label: '기본',
    description: '간단한 한국어 자기소개',
    values: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 800,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'creative',
    label: '창의적 글쓰기',
    description: 'temperature 1.5로 다양한 결과',
    values: {
      model: 'gpt-4o',
      temperature: 1.5,
      top_p: 1.0,
      max_tokens: 1500,
      system: '당신은 창의적인 한국어 작가입니다. 비유와 묘사가 풍부한 문장을 사용하세요.',
      user: '비 오는 날 오후의 카페를 묘사하는 짧은 글을 써주세요. 5문장 이내.',
    },
  },
  {
    id: 'deterministic',
    label: '결정적 코드 생성',
    description: 'temperature 0.0으로 일관된 결과',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 800,
      system: 'You are a senior TypeScript developer. Provide clean, well-typed code.',
      user: 'Write a function that returns the nth Fibonacci number iteratively. Include JSDoc.',
    },
  },
  {
    id: 'json-mode',
    label: 'JSON 출력',
    description: '구조화된 응답 강제',
    values: {
      model: 'gpt-4o',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 600,
      system: 'Always respond with valid JSON only. No markdown.',
      user: '서울의 인기 관광지 5곳을 다음 스키마로: [{ name, district, type }]',
    },
  },
]
