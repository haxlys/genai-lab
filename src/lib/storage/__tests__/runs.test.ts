import { describe, it, expect } from 'vitest'
import { saveRun, getRuns, getRunById, deleteRun, clearRuns } from '../runs'

const baseRun = {
  lessonId: 'test-lesson' as const,
  inputs: { a: 1 },
  output: 'hello',
  metadata: {
    provider: 'github-models' as const,
    model: 'gpt-4o-mini',
    latencyMs: 100,
    promptTokens: 5,
    completionTokens: 10,
  },
}

describe('storage/runs', () => {
  it('saveRun assigns id+timestamp and returns the finalized run', () => {
    const r = saveRun(baseRun)
    expect(r.id).toBeTruthy()
    expect(r.timestamp).toBeGreaterThan(0)
    expect(r.output).toBe('hello')
  })

  it('getRuns returns saved runs in newest-first order', () => {
    saveRun({ ...baseRun, output: 'first' })
    saveRun({ ...baseRun, output: 'second' })
    const runs = getRuns()
    expect(runs).toHaveLength(2)
    expect(runs[0].output).toBe('second')
    expect(runs[1].output).toBe('first')
  })

  it('getRuns filters by lessonId', () => {
    saveRun({ ...baseRun, lessonId: 'lesson-a', output: 'A' })
    saveRun({ ...baseRun, lessonId: 'lesson-b', output: 'B' })
    saveRun({ ...baseRun, lessonId: 'lesson-a', output: 'A2' })
    expect(getRuns({ lessonId: 'lesson-a' })).toHaveLength(2)
    expect(getRuns({ lessonId: 'lesson-b' })).toHaveLength(1)
  })

  it('getRunById finds by id', () => {
    const saved = saveRun(baseRun)
    const found = getRunById(saved.id)
    expect(found?.id).toBe(saved.id)
    expect(getRunById('nonexistent')).toBeUndefined()
  })

  it('deleteRun removes by id', () => {
    const a = saveRun({ ...baseRun, output: 'A' })
    const b = saveRun({ ...baseRun, output: 'B' })
    deleteRun(a.id)
    const remaining = getRuns()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(b.id)
  })

  it('clearRuns({lessonId}) clears only that lesson', () => {
    saveRun({ ...baseRun, lessonId: 'lesson-a' })
    saveRun({ ...baseRun, lessonId: 'lesson-b' })
    clearRuns({ lessonId: 'lesson-a' })
    expect(getRuns({ lessonId: 'lesson-a' })).toHaveLength(0)
    expect(getRuns({ lessonId: 'lesson-b' })).toHaveLength(1)
  })

  it('clearRuns() with no filter clears all', () => {
    saveRun(baseRun)
    saveRun(baseRun)
    clearRuns()
    expect(getRuns()).toHaveLength(0)
  })
})
