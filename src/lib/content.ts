/**
 * 콘텐츠 로더 — sync-content가 생성한 content/lessons/*.json을 Vite 빌드 타임에
 * 글로브 임포트해 lesson summaries(eager)와 individual lessons(lazy)를 노출한다.
 */

import type { LessonContent, LessonSummary } from '#/types/lesson'

// ---- summaries: 전체 22개 레슨 요약 (작음, eager) ----
import indexJson from '../../content/lessons/_index.json'

export function getLessonSummaries(): LessonSummary[] {
  return indexJson as LessonSummary[]
}

export function getLessonSummary(id: string): LessonSummary | undefined {
  return getLessonSummaries().find((s) => s.id === id)
}

// ---- individual lessons: <id>.json (큼, lazy) ----
const lessonLoaders = import.meta.glob<{ default: LessonContent }>(
  '../../content/lessons/*.json',
)

export async function getLesson(id: string): Promise<LessonContent | null> {
  // _index.json은 LessonSummary[]라서 LessonContent로 처리하지 않음
  if (id === '_index') return null
  const path = `../../content/lessons/${id}.json`
  const loader = lessonLoaders[path]
  if (!loader) return null
  const mod = await loader()
  return mod.default as LessonContent
}
