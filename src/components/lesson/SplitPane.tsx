import type { ReactNode } from 'react'

/**
 * Split-pane 레이아웃 — 데스크톱에서는 좌/우 분할, 모바일에서는 세로 스택.
 * 좌측은 강의 본문(스크롤), 우측은 인터랙티브 랩(필요 시 sticky).
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
        <div className="lg:sticky lg:top-20">{right}</div>
      </div>
    </div>
  )
}
