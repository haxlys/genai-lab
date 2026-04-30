/**
 * 레슨별 VariableSpec 레지스트리.
 *
 * lesson-specs/<id>.ts 파일을 작성한 뒤 여기에 등록하면, 해당 레슨 페이지의
 * 우측 인터랙티브 패널이 활성화된다.
 *
 * spec.kind에 따라 RunPanel이 분기:
 *   - chat (default): chat completions 스트리밍
 *   - image: DALL-E 이미지 생성 (OpenAI direct)
 *   - embedding: query+corpus 임베딩 + cosine 유사도 정렬
 *   - rag: embedding + chat 합성 (검색된 chunk를 컨텍스트로 주입)
 *   - agent: function-call loop (mock tools 자동 실행)
 */

import type { VariableSpec } from '#/types/lesson'
import { lesson00Spec } from './00-course-setup'
import { lesson01Spec } from './01-introduction-to-genai'
import { lesson02Spec } from './02-exploring-and-comparing-different-llms'
import { lesson03Spec } from './03-using-generative-ai-responsibly'
import { lesson04Spec } from './04-prompt-engineering-fundamentals'
import { lesson05Spec } from './05-advanced-prompts'
import { lesson06Spec } from './06-text-generation-apps'
import { lesson07Spec } from './07-building-chat-applications'
import { lesson08Spec } from './08-building-search-applications'
import { lesson09Spec } from './09-building-image-applications'
import { lesson10Spec } from './10-building-low-code-ai-applications'
import { lesson11Spec } from './11-integrating-with-function-calling'
import { lesson12Spec } from './12-designing-ux-for-ai-applications'
import { lesson13Spec } from './13-securing-ai-applications'
import { lesson14Spec } from './14-the-generative-ai-application-lifecycle'
import { lesson15Spec } from './15-rag-and-vector-databases'
import { lesson16Spec } from './16-open-source-models'
import { lesson17Spec } from './17-ai-agents'
import { lesson18Spec } from './18-fine-tuning'
import { lesson19Spec } from './19-slm'
import { lesson20Spec } from './20-mistral'
import { lesson21Spec } from './21-meta'

const REGISTRY: Record<string, VariableSpec> = {
  '00-course-setup': lesson00Spec,
  '01-introduction-to-genai': lesson01Spec,
  '02-exploring-and-comparing-different-llms': lesson02Spec,
  '03-using-generative-ai-responsibly': lesson03Spec,
  '04-prompt-engineering-fundamentals': lesson04Spec,
  '05-advanced-prompts': lesson05Spec,
  '06-text-generation-apps': lesson06Spec,
  '07-building-chat-applications': lesson07Spec,
  '08-building-search-applications': lesson08Spec,
  '09-building-image-applications': lesson09Spec,
  '10-building-low-code-ai-applications': lesson10Spec,
  '11-integrating-with-function-calling': lesson11Spec,
  '12-designing-ux-for-ai-applications': lesson12Spec,
  '13-securing-ai-applications': lesson13Spec,
  '14-the-generative-ai-application-lifecycle': lesson14Spec,
  '15-rag-and-vector-databases': lesson15Spec,
  '16-open-source-models': lesson16Spec,
  '17-ai-agents': lesson17Spec,
  '18-fine-tuning': lesson18Spec,
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
