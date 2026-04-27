/**
 * 레슨별 VariableSpec 레지스트리.
 *
 * lesson-specs/<id>.ts 파일을 작성한 뒤 여기에 등록하면, 해당 레슨 페이지의
 * 우측 인터랙티브 패널이 활성화된다.
 *
 * 미구현: 08(검색/embedding API), 09(이미지 생성 API), 15(RAG/벡터DB),
 * 17(에이전트 오케스트레이션). 이들은 추가 인프라/API 어댑터 필요해 v2 과제.
 */

import type { VariableSpec } from '#/types/lesson'
import { lesson04Spec } from './04-prompt-engineering-fundamentals'
import { lesson05Spec } from './05-advanced-prompts'
import { lesson06Spec } from './06-text-generation-apps'
import { lesson07Spec } from './07-building-chat-applications'
import { lesson09Spec } from './09-building-image-applications'
import { lesson11Spec } from './11-integrating-with-function-calling'
import { lesson16Spec } from './16-open-source-models'
import { lesson19Spec } from './19-slm'
import { lesson20Spec } from './20-mistral'
import { lesson21Spec } from './21-meta'

const REGISTRY: Record<string, VariableSpec> = {
  '04-prompt-engineering-fundamentals': lesson04Spec,
  '05-advanced-prompts': lesson05Spec,
  '06-text-generation-apps': lesson06Spec,
  '07-building-chat-applications': lesson07Spec,
  '09-building-image-applications': lesson09Spec,
  '11-integrating-with-function-calling': lesson11Spec,
  '16-open-source-models': lesson16Spec,
  '19-slm': lesson19Spec,
  '20-mistral': lesson20Spec,
  '21-meta': lesson21Spec,
}

export function getLessonSpec(lessonId: string): VariableSpec | null {
  return REGISTRY[lessonId] ?? null
}

export function listLessonSpecs(): string[] {
  return Object.keys(REGISTRY)
}
