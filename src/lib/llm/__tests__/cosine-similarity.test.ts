import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from '../github-models-embedding'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 6)
    expect(cosineSimilarity([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])).toBeCloseTo(1, 6)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6)
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 6)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6)
  })

  it('returns 0 when one vector is zero (avoid div-by-zero)', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0)
  })

  it('throws on dimension mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(/차원 불일치/)
  })

  it('handles non-unit-length vectors correctly', () => {
    // [3, 4]와 [3, 4]는 동일 방향 → 1
    expect(cosineSimilarity([3, 4], [3, 4])).toBeCloseTo(1, 6)
    // [3, 4]와 [6, 8]은 같은 방향(스칼라 배수) → 1
    expect(cosineSimilarity([3, 4], [6, 8])).toBeCloseTo(1, 6)
  })
})
