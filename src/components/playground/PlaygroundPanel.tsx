import { useCallback, useEffect, useState } from 'react'
import { Wand2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { RunPanel } from '#/components/lesson/RunPanel'
import { RunHistoryList } from '#/components/lesson/RunHistoryList'

import { PLAYGROUND_PRESETS, playgroundSpec } from '#/lib/lesson-specs/_playground'
import { deleteRun, getRuns } from '#/lib/storage/runs'
import type { Run } from '#/types/run'

/**
 * Playground — 레슨 무관 자유 실험. RunPanel을 그대로 재사용하지만
 * lessonId='playground'로 history에 별도 분류 저장.
 */
export function PlaygroundPanel() {
  const [restoreInputs, setRestoreInputs] = useState<Record<string, unknown> | undefined>(undefined)
  const [runs, setRuns] = useState<Run[]>([])

  const refresh = useCallback(() => {
    setRuns(getRuns({ lessonId: 'playground' }))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" /> 빠른 시작 프리셋
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {PLAYGROUND_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className="h-auto flex-col items-start py-2 text-left"
                  onClick={() => setRestoreInputs(preset.values)}
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {preset.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-1 text-base font-semibold">자유 실험실</h2>
          <p className="mb-5 text-xs text-muted-foreground">
            모델·temperature·top_p·프롬프트를 자유롭게 조합해 LLM 동작을 탐색하세요. 결과는 자동으로 history에 저장됩니다.
          </p>
          <RunPanel
            spec={playgroundSpec}
            lessonId="playground"
            initialValues={restoreInputs}
            onRunComplete={refresh}
          />
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-lg border bg-card p-5">
          <RunHistoryList
            runs={runs}
            onRestore={(run) => setRestoreInputs(run.inputs)}
            onDelete={(id) => {
              deleteRun(id)
              refresh()
            }}
          />
        </div>
        <Separator />
        <div className="rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">팁</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>같은 프롬프트에 temperature 0.0 vs 1.5를 비교해 결정성 vs 창의성을 체감하세요.</li>
            <li>모델만 바꾸고 다른 변수를 동일하게 유지하면 모델별 강점/약점이 드러납니다.</li>
            <li>System 메시지를 변경하는 것이 user 메시지를 바꾸는 것보다 영향이 크기도 합니다.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
