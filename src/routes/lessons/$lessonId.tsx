import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { LessonContent } from '#/components/lesson/LessonContent'
import { LessonCode } from '#/components/lesson/LessonCode'
import { SplitPane } from '#/components/lesson/SplitPane'
import { RunPanel } from '#/components/lesson/RunPanel'
import { RunHistoryList } from '#/components/lesson/RunHistoryList'

import { getLesson, getLessonSummary } from '#/lib/content'
import { getLessonSpec } from '#/lib/lesson-specs'
import { deleteRun, getRuns } from '#/lib/storage/runs'
import type { Run } from '#/types/run'

export const Route = createFileRoute('/lessons/$lessonId')({
  component: LessonPage,
  loader: async ({ params }) => {
    const summary = getLessonSummary(params.lessonId)
    if (!summary) throw notFound()
    const lesson = await getLesson(params.lessonId)
    if (!lesson) throw notFound()
    return { lesson }
  },
})

function LessonPage() {
  const { lesson } = Route.useLoaderData()
  const spec = getLessonSpec(lesson.id)

  // Run history (lesson-scoped)
  const [runs, setRuns] = useState<Run[]>([])
  const [restoreInputs, setRestoreInputs] = useState<Record<string, unknown> | undefined>(undefined)

  const refreshRuns = useCallback(() => {
    setRuns(getRuns({ lessonId: lesson.id }))
  }, [lesson.id])

  useEffect(() => {
    refreshRuns()
  }, [refreshRuns])

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-mono">
            {String(lesson.number).padStart(2, '0')}
          </Badge>
          <Badge variant={lesson.type === 'Build' ? 'default' : 'secondary'}>{lesson.type}</Badge>
          {lesson.weekRecommended && (
            <Badge variant="secondary">{lesson.weekRecommended}주차</Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold leading-tight">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.titleEn}</p>
      </header>

      <SplitPane
        left={
          <div className="space-y-6">
            <LessonCode
              pythonReference={lesson.pythonReference}
              typescriptReference={lesson.typescriptReference}
              typescriptSnippet={spec?.typescriptSnippet}
            />
            <LessonContent markdown={lesson.contentMarkdown} imageMap={lesson.imageMap} />
          </div>
        }
        right={
          <div className="space-y-5">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="mb-1 text-base font-semibold">인터랙티브 랩</h2>
              <p className="mb-5 text-xs text-muted-foreground">
                변수를 조정하고 Run을 누르면 LLM이 실시간으로 응답합니다. 결과는 자동으로 history에 저장됩니다.
              </p>
              {spec ? (
                <RunPanel
                  spec={spec}
                  lessonId={lesson.id}
                  initialValues={restoreInputs}
                  onRunComplete={refreshRuns}
                />
              ) : (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <p className="font-medium">이 레슨은 개념 학습용입니다.</p>
                  <p className="mt-2 text-muted-foreground">
                    자유 실험은 <a href="/playground" className="underline">Playground</a>에서 진행하거나
                    Build 레슨(06, 07, 09, 11, 15 등)으로 이동하세요.
                  </p>
                </div>
              )}
            </div>

            {spec && (
              <div className="rounded-lg border bg-card p-5">
                <RunHistoryList
                  runs={runs}
                  onRestore={(run) => {
                    setRestoreInputs(run.inputs)
                  }}
                  onDelete={(id) => {
                    deleteRun(id)
                    refreshRuns()
                  }}
                />
              </div>
            )}
          </div>
        }
      />

      <Separator className="mt-12" />
    </div>
  )
}
