/**
 * 레슨 16: 오픈소스 모델 — Llama, Mistral, Phi, Cohere 등 OSS 모델 비교.
 * GPT-4o(OpenAI 폐쇄형) 대비 OSS 모델의 강점/약점을 같은 프롬프트로 비교.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant.'
const USER_DEFAULT = 'Explain the difference between supervised and unsupervised learning, in 3 bullet points each. Use simple language.'

export const LESSON_16_PRESETS: Preset[] = [
  {
    id: 'compare-llama-vs-mistral',
    label: 'Llama 70B로 시도',
    description: '같은 프롬프트로 다른 OSS 모델 비교 — model만 바꿔 Run, history에서 비교',
    values: {
      model: 'Meta-Llama-3.1-70B-Instruct',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'mistral-large',
    label: 'Mistral Large로 시도',
    description: '프랑스 회사 Mistral의 플래그십 모델',
    values: {
      model: 'Mistral-large-2411',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'phi-mini',
    label: 'Phi-3.5 Mini (작고 빠름)',
    description: 'MS의 SLM — 14B 미만이지만 추론력 높음. Edge/모바일 배포에 적합',
    values: {
      model: 'Phi-3.5-mini-instruct',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'multilingual-test',
    label: '다국어 능력 비교',
    description: '한국어 응답 품질이 모델별로 큰 차이 — gpt-4o-mini, Llama, Mistral로 비교',
    values: {
      model: 'Meta-Llama-3.1-70B-Instruct',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 800,
      system: '당신은 한국어로 답하는 AI 어시스턴트입니다.',
      user: '다음 영어 문장을 자연스러운 한국어로 번역하고, 의역과 직역의 차이를 설명해주세요:\n"The early bird catches the worm, but the second mouse gets the cheese."',
    },
  },
]

export const lesson16Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'GitHub Models의 OSS 모델들을 같은 프롬프트로 돌려 비교해보세요', options: GITHUB_MODELS_OPTIONS, defaultValue: 'Meta-Llama-3.1-70B-Instruct' },
    { type: 'slider', name: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05, defaultValue: 0.5 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 600 },
    { type: 'textarea', name: 'system', label: 'System 메시지', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 6, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'Meta-Llama-3.1-70B-Instruct'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.5),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_16_PRESETS,
}
