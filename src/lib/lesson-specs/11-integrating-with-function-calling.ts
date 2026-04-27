/**
 * 레슨 11: Function Calling — 모델이 외부 함수를 호출하도록 tools 배열 정의.
 *
 * spec은 tools를 JSON 텍스트로 받아 ChatRequest.tools로 전달. 응답에 tool_calls가
 * 있으면 RunPanel이 출력 하단에 자동으로 표시. 실제 함수 실행은 v2 과제.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ChatRequest, ToolDefinition } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

const SYSTEM_DEFAULT = 'You are a helpful assistant that calls functions to get information.'
const USER_DEFAULT = 'Find me a good Azure course for a beginner data scientist.'

const SEARCH_COURSES_TOOL_JSON = JSON.stringify(
  [
    {
      type: 'function',
      function: {
        name: 'search_courses',
        description: 'Search the Microsoft Learn catalog for courses matching the given parameters.',
        parameters: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: 'The learner role (developer, data-scientist, student, etc.)',
            },
            product: {
              type: 'string',
              description: 'The product (Azure, Power BI, etc.)',
            },
            level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'The experience level',
            },
          },
          required: ['role', 'product', 'level'],
        },
      },
    },
  ],
  null,
  2,
)

const STUDENT_INFO_TOOL_JSON = JSON.stringify(
  [
    {
      type: 'function',
      function: {
        name: 'extract_student_info',
        description: 'Extract structured info about a student from a description.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            major: { type: 'string' },
            school: { type: 'string' },
            gpa: { type: 'number', description: 'GPA on a 4.0 scale' },
            club: { type: 'string', description: 'A club or extracurricular' },
          },
          required: ['name', 'major', 'school'],
        },
      },
    },
  ],
  null,
  2,
)

const WEATHER_TOOL_JSON = JSON.stringify(
  [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get the current weather for a city.',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name, e.g. "Seoul"' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'], default: 'celsius' },
          },
          required: ['city'],
        },
      },
    },
  ],
  null,
  2,
)

export const LESSON_11_PRESETS: Preset[] = [
  {
    id: 'search-courses',
    label: '코스 검색 (원본 노트북)',
    description: '학습 카탈로그 검색 함수 — 모델이 user 메시지에서 role/product/level을 추출해 호출',
    values: {
      model: 'gpt-4o',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 400,
      system: SYSTEM_DEFAULT,
      user: 'Find me a good Azure course for a beginner data scientist.',
      tools: SEARCH_COURSES_TOOL_JSON,
    },
  },
  {
    id: 'student-info',
    label: '학생 정보 추출 (Structured output)',
    description: '비정형 텍스트 → 구조화 JSON. function calling으로 안전하게 파싱',
    values: {
      model: 'gpt-4o',
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 300,
      system: 'You extract structured information by calling tools. Never reply in plain text.',
      user: 'Emily Johnson is a sophomore majoring in computer science at Duke University. She has a 3.7 GPA. Emily is an active member of the Chess Club.',
      tools: STUDENT_INFO_TOOL_JSON,
    },
  },
  {
    id: 'weather',
    label: '날씨 조회 (간단)',
    description: '가장 단순한 단일 함수 호출 예제 — function calling 메커니즘 이해용',
    values: {
      model: 'gpt-4o',
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 200,
      system: SYSTEM_DEFAULT,
      user: '서울 날씨 알려줘 (섭씨로)',
      tools: WEATHER_TOOL_JSON,
    },
  },
]

export const lesson11Spec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', description: 'gpt-4o가 function calling 정확도가 가장 높음. 일부 OSS 모델은 미지원', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o' },
    { type: 'slider', name: 'temperature', label: 'Temperature', description: 'function calling은 결정성이 중요 — 0.0~0.3 권장', min: 0, max: 2, step: 0.05, defaultValue: 0.2 },
    { type: 'slider', name: 'top_p', label: 'Top-p', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { type: 'number', name: 'max_tokens', label: 'Max tokens', min: 50, max: 2000, step: 50, defaultValue: 400 },
    { type: 'textarea', name: 'system', label: 'System 메시지', placeholder: SYSTEM_DEFAULT, rows: 3, defaultValue: SYSTEM_DEFAULT },
    { type: 'textarea', name: 'user', label: 'User 메시지', placeholder: USER_DEFAULT, rows: 4, defaultValue: USER_DEFAULT },
    {
      type: 'json',
      name: 'tools',
      label: 'Tools (함수 정의 JSON)',
      description: 'OpenAI tools 스키마 배열. 모델이 적절한 함수를 골라 arguments JSON과 함께 반환. genai-lab은 실제 함수 실행은 하지 않고, tool_calls를 결과 패널에 표시.',
      schemaHint: '[{ "type":"function", "function":{ "name", "description", "parameters":{...} } }]',
      defaultValue: SEARCH_COURSES_TOOL_JSON,
    },
  ],
  buildRequest: (values): ChatRequest => {
    let tools: ToolDefinition[] | undefined
    try {
      const parsed = JSON.parse(String(values.tools ?? '[]'))
      if (Array.isArray(parsed) && parsed.length > 0) tools = parsed
    } catch {
      // tools JSON 파싱 실패 — 무시하고 일반 chat completion으로
    }
    return {
      provider: 'github-models',
      model: String(values.model ?? 'gpt-4o'),
      messages: [
        { role: 'system', content: String(values.system ?? SYSTEM_DEFAULT) },
        { role: 'user', content: String(values.user ?? USER_DEFAULT) },
      ],
      temperature: Number(values.temperature ?? 0.2),
      top_p: Number(values.top_p ?? 1.0),
      max_tokens: Number(values.max_tokens ?? 400),
      tools,
      tool_choice: tools ? 'auto' : undefined,
    }
  },
  presets: LESSON_11_PRESETS,
}
