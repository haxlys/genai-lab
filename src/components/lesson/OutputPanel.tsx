import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import type { GeneratedImage } from '#/types/image'

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
  | {
      status: 'image-success'
      images: GeneratedImage[]
      latencyMs: number
      model: string
      promptUsed: string
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
        {state.status === 'image-success' && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {state.images.map((img, i) => (
                <figure key={i} className="overflow-hidden rounded-md border bg-muted">
                  {img.url ? (
                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={`generated ${i + 1}`} className="h-auto w-full" />
                    </a>
                  ) : img.b64_json ? (
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={`generated ${i + 1}`}
                      className="h-auto w-full"
                    />
                  ) : null}
                  {img.revised_prompt && (
                    <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Revised prompt:</span>{' '}
                      {img.revised_prompt}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              요청한 프롬프트: <code className="rounded bg-muted px-1">{state.promptUsed}</code>
            </p>
          </div>
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
      {state.status === 'image-success' && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs">
          <Badge variant="outline" className="font-mono">
            {state.model}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.latencyMs}ms</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.images.length}장 생성</span>
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
    case 'image-success':
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
