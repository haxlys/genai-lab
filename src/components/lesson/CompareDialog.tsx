import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Badge } from '#/components/ui/badge'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Separator } from '#/components/ui/separator'
import type { Run } from '#/types/run'

/**
 * 두 Run을 side-by-side로 비교하는 다이얼로그.
 * inputs의 차이를 좌우 컬럼에서 강조 표시, output은 그대로 보여준다.
 */
export function CompareDialog({
  open,
  onOpenChange,
  left,
  right,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  left: Run | null
  right: Run | null
}) {
  const diffKeys = useMemo(() => {
    if (!left || !right) return new Set<string>()
    const diff = new Set<string>()
    const allKeys = new Set([...Object.keys(left.inputs), ...Object.keys(right.inputs)])
    for (const k of allKeys) {
      if (JSON.stringify(left.inputs[k]) !== JSON.stringify(right.inputs[k])) diff.add(k)
    }
    return diff
  }, [left, right])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Run 비교</DialogTitle>
        </DialogHeader>
        {left && right ? (
          <ScrollArea className="max-h-[75vh]">
            <div className="grid gap-6 lg:grid-cols-2">
              <RunColumn label="좌측" run={left} diffKeys={diffKeys} />
              <RunColumn label="우측" run={right} diffKeys={diffKeys} />
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">두 개의 Run을 선택하세요.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RunColumn({
  label,
  run,
  diffKeys,
}: {
  label: string
  run: Run
  diffKeys: Set<string>
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{label}</Badge>
        <span>{new Date(run.timestamp).toLocaleString('ko-KR')}</span>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          입력 변수
        </h3>
        <dl className="space-y-1.5 rounded-md border bg-card p-3 text-xs">
          {Object.entries(run.inputs).map(([k, v]) => {
            const isDiff = diffKeys.has(k)
            return (
              <div key={k} className={isDiff ? 'rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/30' : ''}>
                <dt className="font-mono font-semibold text-muted-foreground">{k}</dt>
                <dd className="ml-3 break-words font-mono">{formatValue(v)}</dd>
              </div>
            )
          })}
        </dl>
      </div>

      <Separator />

      <div>
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          출력
        </h3>
        {run.error ? (
          <pre className="whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            {run.error}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap break-words rounded-md border bg-card p-3 text-xs">
            {run.output}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <Badge variant="outline" className="font-mono">
          {run.metadata.model}
        </Badge>
        <Badge variant="outline">{run.metadata.latencyMs}ms</Badge>
        <Badge variant="outline">
          {run.metadata.promptTokens} → {run.metadata.completionTokens} tokens
        </Badge>
      </div>
    </div>
  )
}

function formatValue(v: unknown): string {
  if (typeof v === 'string') {
    return v.length > 200 ? v.slice(0, 200) + '…' : v
  }
  return JSON.stringify(v)
}
