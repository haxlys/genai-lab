/**
 * 레슨별 VariableSpec 레지스트리.
 *
 * lesson-specs/<id>.ts 파일을 작성한 뒤 여기에 등록하면, 해당 레슨 페이지의
 * 우측 인터랙티브 패널이 활성화된다.
 */

import type { VariableSpec } from '#/types/lesson'
import { lesson04Spec } from './04-prompt-engineering-fundamentals'
import { lesson06Spec } from './06-text-generation-apps'

const REGISTRY: Record<string, VariableSpec> = {
  '04-prompt-engineering-fundamentals': lesson04Spec,
  '06-text-generation-apps': lesson06Spec,
}

export function getLessonSpec(lessonId: string): VariableSpec | null {
  return REGISTRY[lessonId] ?? null
}

export function listLessonSpecs(): string[] {
  return Object.keys(REGISTRY)
}
