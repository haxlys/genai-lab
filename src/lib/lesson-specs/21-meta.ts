/**
 * 레슨 21: Meta 모델 (Llama 3.1) — 8B/70B/405B 사이즈별 선택.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant.'
const USER_DEFAULT = 'In one paragraph, explain what makes Llama 3 different from earlier open-source LLMs.'

export const LESSON_21_PRESETS: Preset[] = [
  {
    id: 'llama-70b-reasoning',
    label: 'Llama 3.1 70B: 추론',
    description: '70B는 강한 추론 + 대부분의 OSS 비교에서 상위',
    values: {
      model: 'Meta-Llama-3.1-70B-Instruct',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 800,
      system: 'You are a careful reasoner. Show your steps before concluding.',
      user: 'A water tank fills at 5 L/min and drains at 2 L/min. If it starts empty and has a 60 L capacity, when does it overflow? Show calculation.',
    },
  },
  {
    id: 'llama-8b-fast',
    label: 'Llama 3.1 8B: 빠른 응답',
    description: '8B는 같은 GitHub Models에서 가장 응답 빠름. 단순 챗에 적합',
    values: {
      model: 'Meta-Llama-3.1-8B-Instruct',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 400,
      system: SYSTEM_DEFAULT,
      user: '오늘 저녁 30분 안에 만들 수 있는 한식 요리 3개만 추천해주세요.',
    },
  },
  {
    id: 'llama-bilingual',
    label: 'Llama 다국어 능력',
    description: 'Llama 3.1은 다국어 지원 강화 — 한국어 응답 품질 확인',
    values: {
      model: 'Meta-Llama-3.1-70B-Instruct',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 600,
      system: '당신은 한국어로 답하는 친절한 작문 코치입니다.',
      user: '"가을이 깊어가는 어느 날"로 시작하는 짧은 산문(5-7문장)을 써주세요. 비유와 감각 묘사 포함.',
    },
  },
]

export const lesson21Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'Llama 3.1 패밀리 우선', options: GITHUB_MODELS_OPTIONS, defaultValue: 'Meta-Llama-3.1-70B-Instruct' },
    { type: 'slider', name: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05, defaultValue: 0.6 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 600 },
    { type: 'textarea', name: 'system', label: 'System 메시지', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 5, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'Meta-Llama-3.1-70B-Instruct'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.6),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_21_PRESETS,
}
