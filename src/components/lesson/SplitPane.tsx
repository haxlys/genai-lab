import type { ReactNode } from 'react'

/**
 * Split-pane 레이아웃 — 데스크톱에서는 좌/우 분할, 모바일에서는 세로 스택.
 *
 * 데스크톱(lg+):
 *   - 좌측: 강의 본문 — 페이지 자체와 함께 스크롤
 *   - 우측: 인터랙티브 랩 — sticky로 뷰포트에 고정되며,
 *     자체 max-height + overflow-y-auto로 내용이 길면 내부 스크롤.
 *     이렇게 하지 않으면 사용자가 우측 하단을 보려고 좌측 본문을
 *     끝까지 스크롤해야 하는 문제가 생김.
 *
 * 모바일: lg: 미만에서는 세로 스택, 좌/우가 자연 흐름으로 이어짐.
 *
 * top-20 (5rem) = sticky 헤더 56px(h-14) + 약간의 여유.
 * max-h calc는 viewport에서 sticky 시작점과 동일한 양을 빼고,
 * 추가로 1.5rem(24px) 여백을 둔다.
 */
export function SplitPane({
  left,
  right,
}: {
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:items-start">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-2">
          {right}
        </div>
      </div>
    </div>
  )
}
