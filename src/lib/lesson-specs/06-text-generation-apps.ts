/**
 * 레슨 06: 텍스트 생성 앱 만들기 — 레시피 생성기.
 *
 * 원본 코드: 06-text-generation-apps/python/githubmodels-app.py
 * 핵심 학습 포인트: temperature/top_p/max_tokens가 응답에 어떻게 영향을 주는지,
 * system 메시지로 어시스턴트 페르소나를 어떻게 제어하는지.
 */

import type { VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant.'
const USER_DEFAULT =
  'Show me 5 recipes for a dish with the following ingredients: chicken, potatoes, and carrots. Per recipe, list all the ingredients used'

export const lesson06Spec: VariableSpec = {
  fields: [
    {
      type: 'select',
      name: 'model',
      label: '모델',
      description: 'GitHub Models 카탈로그에서 사용 가능한 모델. 같은 프롬프트에 모델별 응답을 비교해보세요.',
      options: GITHUB_MODELS_OPTIONS,
      defaultValue: 'gpt-4o',
    },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description: '0에 가까우면 결정적·반복가능, 1에 가까우면 다양·창의적. 같은 프롬프트로 0.2 vs 1.0을 비교해보세요.',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 1.0,
    },
    {
      type: 'slider',
      name: 'top_p',
      label: 'Top-p (nucleus sampling)',
      description: '확률 누적 임계값. temperature와 함께 쓰지 말고 둘 중 하나만 조정하는 게 일반적.',
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 1.0,
    },
    {
      type: 'number',
      name: 'max_tokens',
      label: 'Max tokens',
      description: '응답의 최대 토큰 수. 너무 작으면 잘리고 너무 크면 비용 증가.',
      min: 50,
      max: 4000,
      step: 50,
      defaultValue: 1000,
    },
    {
      type: 'textarea',
      name: 'system',
      label: 'System 메시지',
      description: '어시스턴트의 역할/페르소나/제약을 정의. "당신은 세프 어시스턴트입니다" 같이 바꿔보세요.',
      placeholder: SYSTEM_DEFAULT,
      rows: 3,
      defaultValue: SYSTEM_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'user',
      label: 'User 메시지 (프롬프트)',
      description: '실제 요청. 재료를 바꾸거나 "5개"를 "10개"로 바꾸거나, 비건 등 제약을 추가해보세요.',
      placeholder: USER_DEFAULT,
      rows: 6,
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
    max_tokens: Number(values.max_tokens ?? 1000),
  }),
  typescriptSnippet: `// genai-lab이 실제로 호출하는 TypeScript 등가 코드
const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${githubToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',                                    // ← 모델 변수
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },  // ← System 변수
      { role: 'user',   content: 'Show me 5 recipes...' },          // ← User 변수
    ],
    temperature: 1.0,    // ← Temperature 변수
    top_p: 1.0,          // ← Top-p 변수
    max_tokens: 1000,    // ← Max tokens 변수
    stream: true,        // genai-lab은 SSE 스트리밍 사용
  }),
})

// SSE 청크를 한 토큰씩 파싱해서 OutputPanel에 표시
const reader = response.body!.getReader()
// ... eventsource-parser로 'data: {...}' 라인 → JSON.parse → delta.content
`,
}
