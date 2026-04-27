import type { ReactNode } from 'react'

/**
 * Split-pane 레이아웃 — 데스크톱에서는 좌/우 분할, 모바일에서는 세로 스택.
 *
 * 데스크톱(lg+):
 *   - 좌측: 강의 본문 — 페이지 자체와 함께 스크롤
 *   - 우측 컬럼: 그리드 stretch(default)로 좌측과 같은 높이 → sticky가 동작할
 *     긴 트랙 확보. items-start를 쓰면 우측 컬럼이 sticky 자식 높이로 줄어
 *     stick할 공간이 사라지므로 stretch를 유지해야 한다.
 *   - 우측 sticky 컨테이너: top-20으로 헤더(56px) 아래 고정,
 *     max-height로 뷰포트를 넘기지 않게 + overflow-y-auto로 내용이 길면
 *     자체 스크롤. 이렇게 하면 sticky 효과 + 내부 스크롤 모두 만족.
 *
 * 모바일(lg 미만): 세로 스택, sticky/max-h/overflow 모두 미적용.
 */
export function SplitPane({
  left,
  right,
}: {
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-2">
          {right}
        </div>
      </div>
    </div>
  )
}
