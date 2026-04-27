/**
 * 레슨 07: 챗 애플리케이션 — 대화 히스토리 관리, 페르소나, 컨텍스트 윤리.
 * 다중 턴은 단일 user 텍스트 영역에 Q/A 흐름으로 풀어 표현 (multi-message
 * 편집기는 v2). 핵심 학습 포인트: system이 페르소나, history가 일관성, temperature가 다양성.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful, friendly career coach. Always end with one follow-up question to keep the conversation going.'
const USER_DEFAULT = '안녕하세요. 저는 데이터 분석가에서 ML 엔지니어로 전환을 고민 중입니다.'

export const LESSON_07_PRESETS: Preset[] = [
  {
    id: 'persona-coach',
    label: '페르소나(Career coach)',
    description: 'system으로 "친절한 커리어 코치" + 후속 질문 강제 → 대화가 자연스럽게 이어짐',
    values: {
      model: 'gpt-4o',
      temperature: 0.8,
      top_p: 1.0,
      max_tokens: 600,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'multi-turn-context',
    label: '다중 턴 컨텍스트',
    description: '이전 Q/A를 user에 포함 → 모델이 맥락을 유지하며 응답하는지 관찰',
    values: {
      model: 'gpt-4o',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 600,
      system: '당신은 한국어로 답하는 친절한 데이터 사이언스 멘토입니다.',
      user: `이전 대화:
Q: 머신러닝 시작하려는데 어디서 시작하면 좋을까요?
A: scikit-learn을 추천드립니다. 간단한 분류·회귀 예제로 시작하세요.

새 질문:
Q: scikit-learn에서 첫 프로젝트로 어떤 데이터셋을 추천하시나요?`,
    },
  },
  {
    id: 'safety-refusal',
    label: '안전한 거절 (Safety)',
    description: 'system에 정중한 거절 정책을 명시 — 부적절 요청에 어떻게 반응하는지 관찰',
    values: {
      model: 'gpt-4o',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 400,
      system: '당신은 도움을 주려 노력하지만, 의료/법률/금융 관련 결정적 조언은 정중히 거절하고 전문가 상담을 권합니다. 한국어로 답하세요.',
      user: '저 두통이 자주 있는데 어떤 약을 먹어야 할까요?',
    },
  },
  {
    id: 'tone-shift',
    label: '톤 변경 비교',
    description: '같은 질문을 formal vs casual 페르소나로 — 출력 차이 관찰',
    values: {
      model: 'gpt-4o',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 400,
      system: 'You are extremely formal, like a 19th-century English butler. Always address the user as "Sir" or "Madam". Answer in English.',
      user: 'How do I make pasta?',
    },
  },
]

export const lesson07Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o' },
    { type: 'slider', name: 'temperature', label: 'Temperature', description: '챗봇은 0.7~1.0이 자연스러움. 너무 낮으면 단조롭고 너무 높으면 산만해짐', min: 0, max: 2, step: 0.05, defaultValue: 0.8 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 600 },
    { type: 'textarea', name: 'system', label: 'System 메시지 (페르소나)', description: '챗봇의 정체성·역할·언어·제약을 박는 곳. 한 번 잘 박으면 매 턴마다 다시 안내할 필요 없음', placeholder: SYSTEM_DEFAULT, rows: 4, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', description: '단순 질문 또는 "이전 대화 + 새 질문" 형태로', placeholder: USER_DEFAULT, rows: 7, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'gpt-4o'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.8),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_07_PRESETS,
}
