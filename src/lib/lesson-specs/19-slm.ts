/**
 * 레슨 19: SLM (Small Language Model) — Phi 패밀리.
 * 작은 모델의 강점(빠름, 저비용, 엣지 배포)을 같은 작업으로 큰 모델과 비교.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a concise, helpful assistant.'
const USER_DEFAULT = 'Summarize this in one sentence: "The mitochondrion is a double-membrane-bound organelle found in most eukaryotic cells, generating most of the cell\'s supply of ATP."'

export const LESSON_19_PRESETS: Preset[] = [
  {
    id: 'phi-summarize',
    label: 'Phi-3.5 Mini: 요약',
    description: 'SLM은 짧은 입력 → 짧은 출력에 강점. 응답 속도와 토큰 비용을 gpt-4o와 비교',
    values: {
      model: 'Phi-3.5-mini-instruct',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 200,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'phi-classify',
    label: 'Phi-3.5: 감성 분류',
    description: 'classification 태스크는 SLM이 cost-effective — 큰 모델로 가지 않아도 충분',
    values: {
      model: 'Phi-3.5-mini-instruct',
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 50,
      system: 'Classify the sentiment of the user message as exactly one of: POSITIVE, NEUTRAL, NEGATIVE. Respond with only the label.',
      user: '오늘 회의는 진짜 너무 길었는데 결론도 안 나서 짜증나요.',
    },
  },
  {
    id: 'phi-vs-gpt4o',
    label: 'Phi vs gpt-4o-mini 비교',
    description: '같은 추론 문제로 두 작은 모델 비교',
    values: {
      model: 'Phi-3.5-mini-instruct',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 300,
      system: SYSTEM_DEFAULT,
      user: 'If a shop sells apples in bags of 6 and oranges in bags of 4, what is the smallest equal number of apples and oranges I can buy?',
    },
  },
]

export const lesson19Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'Phi-3.5 Mini가 SLM의 대표격. Llama-3.1 8B도 작은 모델', options: GITHUB_MODELS_OPTIONS, defaultValue: 'Phi-3.5-mini-instruct' },
    { type: 'slider', name: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05, defaultValue: 0.3 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', description: 'SLM은 짧은 응답이 효율적', min: 50, max: 2000, step: 50, defaultValue: 300 },
    { type: 'textarea', name: 'system', label: 'System 메시지', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 5, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'Phi-3.5-mini-instruct'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.3),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 300),
  }),
  presets: LESSON_19_PRESETS,
}
