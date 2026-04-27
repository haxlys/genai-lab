/**
 * 레슨 05: 고급 프롬프트 — Chain-of-Thought, 역할 부여, 단계별 정제, 코드 리뷰.
 * 원본 노트북/스크립트는 secure code generation을 다루지만, 본 spec은
 * 더 넓은 "고급 프롬프트 기법"을 학습할 수 있도록 4개 시나리오로 구성.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant.'
const USER_DEFAULT = "Let's think step by step. If a train travels 60 mph for 2.5 hours, how far does it go?"

export const LESSON_05_PRESETS: Preset[] = [
  {
    id: 'cot',
    label: 'Chain-of-Thought',
    description: '"단계별로 생각해보자"를 명시 — 추론 과정을 풀어쓰게 만들어 정확도 ↑',
    values: {
      model: 'gpt-4o',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 600,
      system: 'You are a careful problem-solver. Always show your reasoning step-by-step before answering.',
      user: 'A bag has 5 red balls and 7 blue balls. I draw 2 balls without replacement. What is the probability that both are red? Think step-by-step.',
    },
  },
  {
    id: 'role-play',
    label: '역할 부여 (Role-play)',
    description: '시스템에 구체적 전문가 역할 — 답변 톤·깊이가 크게 변함',
    values: {
      model: 'gpt-4o',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 800,
      system: 'You are a senior software architect with 20 years of experience. You write concise, opinionated reviews and always justify trade-offs.',
      user: 'Review this code and suggest improvements:\n\n```python\ndef get(d, k):\n  try: return d[k]\n  except: return None\n```',
    },
  },
  {
    id: 'refine-iteratively',
    label: '단계별 정제',
    description: '한 번에 모든 걸 요구하지 말고 단계로 분해해 묻기',
    values: {
      model: 'gpt-4o',
      temperature: 0.3,
      top_p: 1.0,
      max_tokens: 1000,
      system: 'You produce structured output. Each section is clearly labeled.',
      user: `Help me design a REST API for a todo app. Follow these steps in order:
1. List the resources and HTTP methods.
2. For each endpoint, give the request/response JSON shape.
3. Mention any auth/validation concerns.

Don't skip steps. Use markdown headings.`,
    },
  },
  {
    id: 'code-security-review',
    label: '코드 보안 리뷰 (원본 lesson 주제)',
    description: '원본 노트북의 secure code generation 실습 — Flask hello world의 보안 취약점 찾기',
    values: {
      model: 'gpt-4o',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 1200,
      system: 'You are a security-focused code reviewer. Identify vulnerabilities (XSS, injection, secrets in code, missing validation) and give corrected code.',
      user: `Review this Flask code for security issues. List each issue with severity, then provide a corrected version.

\`\`\`python
from flask import Flask, request
app = Flask(__name__)

@app.route('/')
def hello():
    name = request.args.get('name', 'World')
    return f'Hello, {name}!'

if __name__ == '__main__':
    app.run()
\`\`\``,
    },
  },
]

export const lesson05Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o' },
    { type: 'slider', name: 'temperature', label: 'Temperature', description: '추론 작업은 0.2~0.4 권장', min: 0, max: 2, step: 0.05, defaultValue: 0.4 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 4000, step: 50, defaultValue: 800 },
    { type: 'textarea', name: 'system', label: 'System 메시지', description: '고급 프롬프트의 핵심 — 역할/제약/출력 형식을 system에 박는 게 가장 효과적', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 8, defaultValue: USER_DEFAULT },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'gpt-4o'),
    messages: [
      { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
      { role: 'user', content: String(values.user ?? USER_DEFAULT) },
    ],
    temperature: Number(values.temperature ?? 0.4),
    top_p: Number(values.top_p ?? 1.0),
    max_tokens: Number(values.max_tokens ?? 800),
  }),
  presets: LESSON_05_PRESETS,
}
