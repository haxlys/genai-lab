/**
 * 한국어/영어 헤딩에서 안정적인 anchor id를 생성.
 *
 * - 소문자화
 * - 영숫자/한글/공백/하이픈 외 문자 제거
 * - 공백을 하이픈으로
 * - 연속 하이픈 압축
 * - 양 끝 하이픈 제거
 * - 빈 결과면 'section'로 폴백
 */
export function slugify(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return normalized || 'section'
}
