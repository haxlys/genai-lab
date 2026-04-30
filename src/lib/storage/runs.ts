/**
 * Run history 저장소 — localStorage에 모든 실행 기록 보관.
 * 최대 보관 개수 200개 (오래된 것부터 삭제).
 */

import { nanoid } from 'nanoid'
import type { Run } from '#/types/run'

const RUNS_KEY = 'genai-lab:runs:v1'
const MAX_RUNS = 200

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function readAll(): Run[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(RUNS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Run[]
  } catch {
    return []
  }
}

function writeAll(runs: Run[]): void {
  if (!isBrowser()) return
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs))
}

export function getRuns(filter?: { lessonId?: string }): Run[] {
  const all = readAll()
  if (filter?.lessonId) {
    return all.filter((r) => r.lessonId === filter.lessonId)
  }
  return all
}

export function getRunById(id: string): Run | undefined {
  return readAll().find((r) => r.id === id)
}

export function saveRun(run: Omit<Run, 'id' | 'timestamp'> & Partial<Pick<Run, 'id' | 'timestamp'>>): Run {
  const finalized: Run = {
    id: run.id ?? nanoid(),
    timestamp: run.timestamp ?? Date.now(),
    lessonId: run.lessonId,
    inputs: run.inputs,
    output: run.output,
    metadata: run.metadata,
    error: run.error,
  }
  const all = readAll()
  all.unshift(finalized)
  // 최대 개수 초과 시 가장 오래된 것 제거
  while (all.length > MAX_RUNS) all.pop()
  writeAll(all)
  return finalized
}

export function deleteRun(id: string): void {
  const all = readAll().filter((r) => r.id !== id)
  writeAll(all)
}

export function clearRuns(filter?: { lessonId?: string }): void {
  if (!filter) {
    writeAll([])
    return
  }
  const all = readAll().filter((r) => r.lessonId !== filter.lessonId)
  writeAll(all)
}

/**
 * 모든 Run을 JSON 문자열로 직렬화. 파일 다운로드용.
 */
export function exportRunsAsJson(): string {
  return JSON.stringify(readAll(), null, 2)
}

export type ImportSummary = {
  imported: number
  skipped: number
  total: number
}

/**
 * JSON 문자열을 파싱해 기존 runs와 병합. id가 같으면 timestamp가 새로운 것을 유지.
 * 잘못된 형식이면 throw.
 */
export function importRunsFromJson(json: string): ImportSummary {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('JSON 파싱에 실패했습니다. 파일 형식을 확인하세요.')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Run history는 배열이어야 합니다.')
  }
  const incoming: Run[] = []
  for (const item of parsed) {
    if (!isValidRun(item)) {
      throw new Error('일부 항목이 Run 스키마를 만족하지 않습니다.')
    }
    incoming.push(item)
  }

  const existing = readAll()
  const byId = new Map(existing.map((r) => [r.id, r]))
  let imported = 0
  let skipped = 0
  for (const r of incoming) {
    const dup = byId.get(r.id)
    if (dup) {
      // timestamp가 더 새로운 쪽을 유지
      if (r.timestamp > dup.timestamp) {
        byId.set(r.id, r)
        imported += 1
      } else {
        skipped += 1
      }
    } else {
      byId.set(r.id, r)
      imported += 1
    }
  }

  // timestamp 내림차순 정렬 후 MAX_RUNS로 자름
  const merged = [...byId.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_RUNS)
  writeAll(merged)
  return { imported, skipped, total: incoming.length }
}

function isValidRun(x: unknown): x is Run {
  if (!x || typeof x !== 'object') return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.timestamp === 'number' &&
    typeof r.lessonId === 'string' &&
    typeof r.output === 'string' &&
    !!r.inputs &&
    typeof r.inputs === 'object' &&
    !!r.metadata &&
    typeof r.metadata === 'object'
  )
}
