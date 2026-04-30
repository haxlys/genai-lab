/**
 * 레슨 본문 마크다운에 포함된 이미지 src 정규화.
 *
 * 한국어 README는 `../../../translated_images/ko/<name>.<hash>.webp` 같은
 * 상대 경로로 이미지를 참조한다. 이를 GitHub raw URL로 변환하되, 빌드 타임에
 * 폴백 매핑(imageMap)이 있으면 그쪽을 우선 적용해 한국어 번역 이미지가
 * 누락된 경우 영문 원본으로 자동 대체한다.
 */

const SOURCE_REPO_RAW_BASE =
  'https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/main/'

export function resolveImageSrc(
  src: string | undefined,
  imageMap?: Record<string, string>,
): string | undefined {
  if (!src) return src
  if (/^(https?:|data:|blob:)/.test(src)) return src

  // imageMap에 직접 매칭이 있으면 그 결과를 우선 (이미 절대 URL일 수도 있음)
  if (imageMap && imageMap[src]) {
    const mapped = imageMap[src]
    if (/^(https?:|data:|blob:)/.test(mapped)) return mapped
    return `${SOURCE_REPO_RAW_BASE}${stripRelative(mapped)}`
  }

  return `${SOURCE_REPO_RAW_BASE}${stripRelative(src)}`
}

function stripRelative(src: string): string {
  return src.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '')
}
