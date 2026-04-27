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
