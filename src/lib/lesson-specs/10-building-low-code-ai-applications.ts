/**
 * 레슨 10: 로우코드/노코드 AI 앱.
 *
 * 원본 코스는 Microsoft Power Platform/AI Builder 가이드라 코드 실행이 없다.
 * 대신 "코드 거의 없이 LLM으로 비즈니스 워크플로우 자동화"의 본질을 chat
 * 프리셋으로 보여준다 — 폼 입력 → AI 처리 → 구조화된 출력.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are an AI assistant for business workflows. Always respond in well-structured JSON.'
const USER_DEFAULT = `Extract structured data from this support ticket:

"My laptop won't turn on after the latest Windows update yesterday. I tried holding the power button but nothing happens. I need this for a presentation tomorrow morning. Order # ABC-12345."

Schema: { issue, urgency: 'low'|'medium'|'high', troubleshooting_done, deadline, order_number }`

export const LESSON_10_PRESETS: Preset[] = [
  {
    id: 'support-ticket',
    label: '고객 지원 티켓 분류',
    description: '비정형 메시지 → 구조화 JSON. 노코드 워크플로우의 가장 흔한 패턴',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 400,
      system: SYSTEM_DEFAULT,
      user: USER_DEFAULT,
    },
  },
  {
    id: 'meeting-summary',
    label: '회의록 요약 + 액션 아이템',
    description: '긴 회의록 → 요약 + 다음 액션 리스트. Slack/Teams 봇에 그대로 응용 가능',
    values: {
      model: 'gpt-4o',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 800,
      system: 'Return JSON: { summary: string, action_items: Array<{ owner, task, deadline }> }',
      user: `회의록:
- 김부장: 다음 주까지 마케팅 캠페인 결과 보고서 만들어주세요
- 이대리: 알겠습니다. 화요일까지 초안 공유드리겠습니다
- 박과장: 제가 디자인 부분 검토할 수 있어요. 수요일까지 가능합니다
- 김부장: 좋아요. 그리고 신규 사이트 런칭은 다음 주 목요일로 확정합시다
- 모두: 동의

요약 + 액션 아이템 추출`,
    },
  },
  {
    id: 'invoice-extract',
    label: '청구서 데이터 추출',
    description: '인보이스 텍스트 → 구조화 데이터 (Power Automate 시나리오)',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 400,
      system: 'Extract invoice data as JSON: { invoice_number, vendor, date, line_items: [{description, quantity, unit_price, total}], subtotal, tax, grand_total, currency }',
      user: `INVOICE
ABC Office Supplies Ltd.
Invoice #: INV-2026-0042
Date: 2026-04-15

Description                Qty    Unit Price    Total
A4 Paper (500 sheets)      10     $5.00         $50.00
Stapler                    5      $8.00         $40.00
Black Pens (12-pack)       3      $4.50         $13.50

Subtotal: $103.50
Tax (10%): $10.35
TOTAL: $113.85 USD`,
    },
  },
  {
    id: 'email-classify',
    label: '이메일 분류 + 자동 답신',
    description: '받은 메일 분류 → 카테고리에 따라 다른 응답 생성',
    values: {
      model: 'gpt-4o-mini',
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 500,
      system: 'JSON 응답: { category: "complaint"|"inquiry"|"compliment"|"other", priority: 1-5, suggested_reply: string (한국어) }',
      user: `From: customer@example.com
Subject: 환불 요청

지난주에 주문한 제품(주문번호: KR-9988)이 완전히 망가져서 도착했습니다. 박스부터 손상돼 있었어요. 즉시 환불 처리 부탁드립니다. 매우 실망스럽네요.`,
    },
  },
]

export const lesson10Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o' },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description: '구조화 추출 작업은 0.0이 안정적',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 0.0,
    },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 600 },
    {
      type: 'textarea',
      name: 'system',
      label: 'System (스키마/규칙 정의)',
      description: '로우코드 워크플로우에서 system은 출력 형식을 강제하는 곳',
      placeholder: SYSTEM_DEFAULT,
      rows: 3,
      defaultValue: SYSTEM_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'user',
      label: 'User (입력 데이터)',
      description: '실제 비정형 데이터 — 이메일/회의록/문서 등',
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
    temperature: Number(values.temperature ?? 0.0),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_10_PRESETS,
}
