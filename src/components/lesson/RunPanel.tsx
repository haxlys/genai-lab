import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Square, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { VariableForm } from './VariableForm'
import { OutputPanel, type RunState } from './OutputPanel'

import { streamChat } from '#/lib/llm'
import { saveRun } from '#/lib/storage/runs'
import { getKeyForProvider, getSettings } from '#/lib/storage/settings'
import type { VariableSpec } from '#/types/lesson'

/**
 * 레슨/Playground에서 공통 사용하는 Run 패널.
 * VariableForm으로 입력 받아 Run 시 streamChat으로 호출, OutputPanel에 결과 표시.
 * 성공 시 localStorage에 Run 자동 저장.
 */
export function RunPanel({
  spec,
  lessonId,
  initialValues,
  onRunComplete,
}: {
  spec: VariableSpec
  lessonId: string | 'playground'
  initialValues?: Record<string, unknown>
  onRunComplete?: () => void
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {})
  const [state, setState] = useState<RunState>({ status: 'idle' })
  const [restoreFromPreset, setRestoreFromPreset] = useState<Record<string, unknown> | undefined>(
    initialValues,
  )
  const abortRef = useRef<AbortController | null>(null)

  // 외부에서 initialValues가 바뀌면(history 복원 등) 폼 리셋용 state도 함께 갱신
  useEffect(() => {
    if (initialValues) setRestoreFromPreset(initialValues)
  }, [initialValues])

  const handleRun = useCallback(async () => {
    // 이미 실행 중이면 중단
    if (state.status === 'running') {
      abortRef.current?.abort()
      return
    }

    const request = spec.buildRequest(values)
    const settings = getSettings()
    const apiKey = getKeyForProvider(request.provider, settings)

    if (!apiKey) {
      toast.error('API 키가 설정되지 않았습니다.', {
        description: `Settings 페이지에서 ${request.provider}용 키를 입력하거나 .env에 정의하세요.`,
      })
      return
    }

    setState({ status: 'running', partial: '' })
    abortRef.current = new AbortController()

    try {
      const result = await streamChat(request, {
        apiKey,
        signal: abortRef.current.signal,
        onChunk: (chunk) => {
          if (chunk.delta) {
            setState((prev) => {
              if (prev.status !== 'running') return prev
              return { status: 'running', partial: prev.partial + chunk.delta }
            })
          }
        },
      })

      // tool_calls(function calling)가 있으면 출력에 함께 표시
      const toolCallSection = result.toolCalls?.length
        ? `\n\n──── Tool calls (${result.toolCalls.length}) ────\n` +
          result.toolCalls
            .map(
              (tc, i) =>
                `[${i + 1}] ${tc.name}\n  args: ${tc.arguments}`,
            )
            .join('\n')
        : ''
      const finalOutput = result.output + toolCallSection

      setState({
        status: 'success',
        output: finalOutput,
        latencyMs: result.latencyMs,
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        model: result.model,
      })

      // localStorage에 자동 저장
      saveRun({
        lessonId,
        inputs: values,
        output: finalOutput,
        metadata: {
          provider: request.provider,
          model: result.model,
          latencyMs: result.latencyMs,
          promptTokens: result.usage.prompt_tokens,
          completionTokens: result.usage.completion_tokens,
        },
      })

      onRunComplete?.()
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState({ status: 'idle' })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      setState({ status: 'error', message })
      saveRun({
        lessonId,
        inputs: values,
        output: '',
        metadata: {
          provider: spec.buildRequest(values).provider,
          model: spec.buildRequest(values).model,
          latencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
        },
        error: message,
      })
      onRunComplete?.()
    } finally {
      abortRef.current = null
    }
  }, [spec, values, lessonId, state.status, onRunComplete])

  return (
    <div className="space-y-4">
      {spec.presets && spec.presets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" />
            빠른 시작 프리셋
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {spec.presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRestoreFromPreset({ ...preset.values })}
                className="rounded-md border bg-card p-2.5 text-left text-xs transition-colors hover:bg-accent"
              >
                <div className="font-medium text-foreground">{preset.label}</div>
                {preset.description && (
                  <div className="mt-0.5 text-muted-foreground">{preset.description}</div>
                )}
              </button>
            ))}
          </div>
          <Separator className="!my-3" />
        </div>
      )}

      <VariableForm spec={spec} initialValues={restoreFromPreset} onChange={setValues} />

      <Separator />

      <Button
        onClick={handleRun}
        size="lg"
        className="w-full"
        variant={state.status === 'running' ? 'secondary' : 'default'}
      >
        {state.status === 'running' ? (
          <>
            <Square className="mr-2 h-4 w-4" /> 중단
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" /> Run
          </>
        )}
      </Button>

      <OutputPanel state={state} />
    </div>
  )
}
