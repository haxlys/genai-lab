/**
 * 학습 진도 저장소 — 방문한 레슨 ID를 localStorage에 영속.
 * SSR 안전(window 가드).
 */

const KEY = 'genai-lab:progress:v1'

type Progress = {
  visitedLessons: string[]
}

function readProgress(): Progress {
  if (typeof window === 'undefined') return { visitedLessons: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { visitedLessons: [] }
    const parsed = JSON.parse(raw) as Progress
    if (!Array.isArray(parsed.visitedLessons)) return { visitedLessons: [] }
    return parsed
  } catch {
    return { visitedLessons: [] }
  }
}

function writeProgress(p: Progress): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // quota / disabled storage — 무시
  }
}

export function getVisited(): Set<string> {
  return new Set(readProgress().visitedLessons)
}

export function isVisited(lessonId: string): boolean {
  return getVisited().has(lessonId)
}

export function markVisited(lessonId: string): void {
  const p = readProgress()
  if (p.visitedLessons.includes(lessonId)) return
  p.visitedLessons.push(lessonId)
  writeProgress(p)
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
