import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Download, GitCompare, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ScrollArea } from '#/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { CompareDialog } from '#/components/lesson/CompareDialog'

import { getLessonSummaries } from '#/lib/content'
import {
  clearRuns,
  deleteRun,
  exportRunsAsJson,
  getRuns,
  importRunsFromJson,
} from '#/lib/storage/runs'
import type { Run } from '#/types/run'

export const Route = createFileRoute('/history')({
  component: History,
  loader: () => ({ summaries: getLessonSummaries() }),
})

function History() {
  const { summaries } = Route.useLoaderData()
  const [allRuns, setAllRuns] = useState<Run[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    setAllRuns(getRuns())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleExport = () => {
    const json = exportRunsAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `genai-lab-runs-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${allRuns.length}개의 Run을 내보냈습니다.`)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 선택할 수 있도록 reset
    if (!file) return
    try {
      const text = await file.text()
      const summary = importRunsFromJson(text)
      refresh()
      toast.success(
        `${summary.imported}개 추가됨${summary.skipped > 0 ? ` · ${summary.skipped}개 skip` : ''}`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error('Import 실패', { description: message })
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return allRuns
    return allRuns.filter((r) => r.lessonId === filter)
  }, [allRuns, filter])

  const lessonTitle = useCallback(
    (id: string) => {
      if (id === 'playground') return 'Playground'
      const s = summaries.find((x) => x.id === id)
      return s ? `${String(s.number).padStart(2, '0')} · ${s.title}` : id
    },
    [summaries],
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const left = filtered.find((r) => r.id === selected[0]) ?? null
  const right = filtered.find((r) => r.id === selected[1]) ?? null

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Run History</h1>
        <p className="mt-2 text-muted-foreground">
          모든 레슨/Playground의 실행 기록. 두 개를 선택하면 side-by-side로 비교할 수 있습니다.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="playground">Playground만</SelectItem>
            {summaries.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {String(s.number).padStart(2, '0')} · {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="secondary"
          disabled={selected.length !== 2}
          onClick={() => setCompareOpen(true)}
        >
          <GitCompare className="mr-1.5 h-4 w-4" /> 비교 ({selected.length}/2)
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button size="sm" variant="outline" onClick={handleImportClick}>
            <Upload className="mr-1.5 h-4 w-4" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={allRuns.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {filtered.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!confirm(`${filter === 'all' ? '모든' : '필터된'} Run 기록을 삭제하시겠습니까?`)) return
                if (filter === 'all') clearRuns()
                else clearRuns({ lessonId: filter })
                refresh()
                setSelected([])
                toast.success('기록이 삭제되었습니다.')
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> 모두 삭제
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {filter === 'all'
              ? '아직 실행 기록이 없습니다. 레슨이나 Playground에서 Run을 한 번 눌러보세요.'
              : '이 필터로는 기록이 없습니다.'}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[70vh]">
          <ul className="space-y-2">
            {filtered.map((run) => (
              <li
                key={run.id}
                className={`rounded-md border bg-card p-3 text-sm transition-colors ${
                  selected.includes(run.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(run.id)}
                    onChange={() => toggle(run.id)}
                    className="h-4 w-4 cursor-pointer"
                  />
                  {run.lessonId === 'playground' ? (
                    <Link to="/playground" className="font-medium hover:underline">
                      {lessonTitle(run.lessonId)}
                    </Link>
                  ) : (
                    <Link
                      to="/lessons/$lessonId"
                      params={{ lessonId: run.lessonId }}
                      className="font-medium hover:underline"
                    >
                      {lessonTitle(run.lessonId)}
                    </Link>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(run.timestamp).toLocaleString('ko-KR')}
                  </span>
                  <Badge variant="outline" className="ml-auto font-mono text-xs">
                    {run.metadata.model}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      deleteRun(run.id)
                      refresh()
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {run.error
                    ? `❌ ${run.error.slice(0, 200)}`
                    : run.output.slice(0, 250) || '(빈 응답)'}
                </p>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {run.metadata.latencyMs}ms · {run.metadata.promptTokens} →{' '}
                  {run.metadata.completionTokens} tokens
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        left={left}
        right={right}
      />
    </div>
  )
}
