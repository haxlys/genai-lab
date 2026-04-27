import { useState } from 'react'
import { GitCompare, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Separator } from '#/components/ui/separator'

import { CompareDialog } from './CompareDialog'
import type { Run } from '#/types/run'

/**
 * Run 카드 리스트. 체크박스로 2개 선택해 Compare, 카드 클릭으로 inputs 복원.
 *
 * @param onRestore - 카드 클릭 시 호출, 부모가 폼 inputs를 해당 Run으로 리셋
 * @param onDelete - 휴지통 아이콘 클릭 시 호출
 */
export function RunHistoryList({
  runs,
  onRestore,
  onDelete,
}: {
  runs: Run[]
  onRestore?: (run: Run) => void
  onDelete?: (id: string) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const left = runs.find((r) => r.id === selected[0]) ?? null
  const right = runs.find((r) => r.id === selected[1]) ?? null

  if (runs.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-center text-xs text-muted-foreground">
        아직 실행 기록이 없습니다. Run을 한 번 누르면 여기에 자동 저장됩니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          이 레슨의 Run 기록 ({runs.length})
        </h3>
        <Button
          size="sm"
          variant="secondary"
          disabled={selected.length !== 2}
          onClick={() => setCompareOpen(true)}
        >
          <GitCompare className="mr-1.5 h-3.5 w-3.5" /> 비교 ({selected.length}/2)
        </Button>
      </div>

      <ScrollArea className="max-h-72">
        <ul className="space-y-2">
          {runs.map((run) => (
            <li
              key={run.id}
              className={`group rounded-md border bg-card p-2.5 text-xs transition-colors ${
                selected.includes(run.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(run.id)}
                  onChange={() => toggle(run.id)}
                  className="h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {new Date(run.timestamp).toLocaleString('ko-KR')}
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {run.metadata.model}
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-2 text-muted-foreground">
                {run.error ? `❌ ${run.error.slice(0, 100)}` : run.output.slice(0, 120) || '(빈 응답)'}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {run.metadata.latencyMs}ms · {run.metadata.promptTokens} → {run.metadata.completionTokens}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {onRestore && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => onRestore(run)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-destructive"
                      onClick={() => onDelete(run.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>

      <Separator />

      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        left={left}
        right={right}
      />
    </div>
  )
}
