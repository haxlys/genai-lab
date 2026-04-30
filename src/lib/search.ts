/**
 * 클라이언트 측 레슨 전문 검색.
 *
 * 빌드 타임에 sync-content가 만든 content/search-index.json을 import해서
 * 단순 substring + 단어 부분 매칭으로 점수 계산. 22개 × ~14KB 데이터셋이라
 * 외부 라이브러리(FlexSearch, lunr) 없이도 충분히 빠르다.
 *
 * 점수:
 *   - title 정확 일치 → 100
 *   - title substring → 50
 *   - body substring → 10 + (occurrences * 2)
 *   - 한 단어 미일치는 0 (모든 토큰이 매칭되어야 함)
 */

import searchIndex from '../../content/search-index.json'

export type SearchEntry = {
  id: string
  number: number
  title: string
  titleEn: string
  body: string
}

export type SearchResult = {
  id: string
  number: number
  title: string
  titleEn: string
  /** 매칭된 위치 주변의 짧은 미리보기 텍스트 (~150자) */
  snippet: string
  score: number
}

const INDEX = searchIndex as SearchEntry[]

/**
 * 쿼리를 입력받아 매칭 점수가 높은 레슨을 반환.
 * 빈 쿼리는 전체 22개를 number 순으로 반환.
 */
export function searchLessons(query: string, limit = 10): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return INDEX.slice(0, limit).map((e) => ({
      id: e.id,
      number: e.number,
      title: e.title,
      titleEn: e.titleEn,
      snippet: e.body.slice(0, 150),
      score: 0,
    }))
  }

  // 공백으로 토큰을 자른다. 모든 토큰이 매칭되어야 한 레슨으로 본다.
  const tokens = q.split(/\s+/).filter((t) => t.length > 0)
  const results: SearchResult[] = []

  for (const entry of INDEX) {
    const titleLow = entry.title.toLowerCase()
    const titleEnLow = entry.titleEn.toLowerCase()
    const bodyLow = entry.body.toLowerCase()

    let totalScore = 0
    let allMatched = true

    for (const token of tokens) {
      let tokenScore = 0
      if (titleLow === token || titleEnLow === token) tokenScore += 100
      if (titleLow.includes(token) || titleEnLow.includes(token)) tokenScore += 50

      // body 매칭: 발생 횟수에 비례한 점수
      if (bodyLow.includes(token)) {
        const occurrences = countOccurrences(bodyLow, token)
        tokenScore += 10 + occurrences * 2
      }

      if (tokenScore === 0) {
        allMatched = false
        break
      }
      totalScore += tokenScore
    }

    if (!allMatched) continue

    results.push({
      id: entry.id,
      number: entry.number,
      title: entry.title,
      titleEn: entry.titleEn,
      snippet: makeSnippet(entry.body, tokens[0]),
      score: totalScore,
    })
  }

  results.sort((a, b) => b.score - a.score || a.number - b.number)
  return results.slice(0, limit)
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let i = 0
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count += 1
    i += needle.length
  }
  return count
}

/**
 * 매칭된 첫 번째 위치 주변의 ~150자 미리보기. 매칭 안 된 경우 본문 앞부분.
 */
function makeSnippet(body: string, token: string): string {
  if (!token) return body.slice(0, 150)
  const lowerBody = body.toLowerCase()
  const idx = lowerBody.indexOf(token.toLowerCase())
  if (idx === -1) return body.slice(0, 150)
  const start = Math.max(0, idx - 40)
  const end = Math.min(body.length, idx + 110)
  const prefix = start > 0 ? '… ' : ''
  const suffix = end < body.length ? ' …' : ''
  return prefix + body.slice(start, end) + suffix
}
