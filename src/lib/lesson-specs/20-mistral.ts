/**
 * 레슨 20: Mistral 모델 — Mistral Large/Nemo/Small의 특성과 비용 균형.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant who responds clearly and concisely.'
const USER_DEFAULT = 'Write a Python function that returns the nth prime number. Include a brief docstring.'

export const LESSON_20_PRESETS: Preset[] = [
  {
    id: 'mistral-large-code',
    label: 'Mistral Large: 코드 생성',
    description: '최상위 Mistral. 추론·코드 모두 강함',
    values: {
      model: 'Mistral-large-2411',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 800,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'mistral-nemo',
    label: 'Mistral Nemo (12B)',
    description: '중간 사이즈, 빠르고 저렴. 일반 챗에 적합',
    values: {
      model: 'Mistral-Nemo',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: '한국에서 첫 직장으로 외국계 vs 국내 대기업, 각각의 장단점은?',
    },
  },
  {
    id: 'mistral-small',
    label: 'Mistral Small',
    description: '가장 저렴. 단순 작업·분류·번역에 적합',
    values: {
      model: 'Mistral-small',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 400,
      system: 'Translate the user message to French. Output only the translation.',
      user: '오늘 날씨가 정말 좋네요. 산책하기 딱 좋은 날입니다.',
    },
  },
]

export const lesson20Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'Mistral 패밀리 우선', options: GITHUB_MODELS_OPTIONS, defaultValue: 'Mistral-large-2411' },
    { type: 'slider', name: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05, defaultValue: 0.5 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 600 },
    { type: 'textarea', name: 'system', label: 'System 메시지', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 5, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'Mistral-large-2411'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.5),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_20_PRESETS,
}
