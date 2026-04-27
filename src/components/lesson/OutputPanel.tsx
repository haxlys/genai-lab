import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'

export type RunState =
  | { status: 'idle' }
  | { status: 'running'; partial: string }
  | {
      status: 'success'
      output: string
      latencyMs: number
      promptTokens: number
      completionTokens: number
      model: string
    }
  | { status: 'error'; message: string }

export function OutputPanel({ state }: { state: RunState }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="text-sm font-medium">결과</div>
        <Status state={state} />
      </div>
      <div className="p-4">
        {state.status === 'idle' && (
          <p className="text-sm text-muted-foreground">
            우측 변수를 조정하고 <strong>Run</strong>을 누르면 LLM 응답이 여기에 표시됩니다.
          </p>
        )}
        {state.status === 'running' && (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm">
            {state.partial || (
              <span className="text-muted-foreground">스트리밍 시작 대기…</span>
            )}
          </pre>
        )}
        {state.status === 'success' && (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm">{state.output}</pre>
        )}
        {state.status === 'error' && (
          <div className="space-y-2 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" /> 오류
            </div>
            <pre className="whitespace-pre-wrap break-words rounded bg-destructive/10 p-3 font-mono text-xs">
              {state.message}
            </pre>
          </div>
        )}
      </div>
      {state.status === 'success' && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs">
          <Badge variant="outline" className="font-mono">
            {state.model}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.latencyMs}ms</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {state.promptTokens} → {state.completionTokens} tokens
          </span>
        </div>
      )}
    </div>
  )
}

function Status({ state }: { state: RunState }) {
  switch (state.status) {
    case 'idle':
      return <span className="text-xs text-muted-foreground">대기</span>
    case 'running':
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> 실행 중
        </span>
      )
    case 'success':
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> 완료
        </span>
      )
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> 실패
        </span>
      )
  }
}
