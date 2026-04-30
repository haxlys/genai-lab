/**
 * 레슨 페이지 하단의 이전/다음 네비게이션. 22개 레슨을 number 기준 정렬한 후
 * 현재 레슨의 인접한 항목으로 prefetch=intent 링크를 생성한다.
 */

import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { getLessonSummaries } from '#/lib/content'

export function LessonNavigation({ currentId }: { currentId: string }) {
  const summaries = getLessonSummaries().slice().sort((a, b) => a.number - b.number)
  const idx = summaries.findIndex((s) => s.id === currentId)
  if (idx === -1) return null

  const prev = idx > 0 ? summaries[idx - 1] : null
  const next = idx < summaries.length - 1 ? summaries[idx + 1] : null

  return (
    <nav className="mt-12 flex items-stretch gap-3">
      <div className="flex-1">
        {prev ? (
          <Link
            to="/lessons/$lessonId"
            params={{ lessonId: prev.id }}
            preload="intent"
            className="flex h-full items-center gap-3 rounded-md border bg-card p-4 transition-colors hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">이전</div>
              <div className="line-clamp-1 text-sm font-medium">
                {String(prev.number).padStart(2, '0')} {prev.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex h-full items-center gap-3 rounded-md border bg-muted/30 p-4 opacity-50">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">첫 레슨입니다</div>
          </div>
        )}
      </div>
      <div className="flex-1">
        {next ? (
          <Link
            to="/lessons/$lessonId"
            params={{ lessonId: next.id }}
            preload="intent"
            className="flex h-full items-center justify-end gap-3 rounded-md border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="text-right">
              <div className="text-xs text-muted-foreground">다음</div>
              <div className="line-clamp-1 text-sm font-medium">
                {String(next.number).padStart(2, '0')} {next.title}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ) : (
          <div className="flex h-full items-center justify-end gap-3 rounded-md border bg-muted/30 p-4 opacity-50">
            <div className="text-xs text-muted-foreground">마지막 레슨입니다</div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </nav>
  )
}
