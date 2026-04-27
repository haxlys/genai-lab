import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import type { GeneratedImage } from '#/types/image'
import type { AgentStep, SearchHit } from '#/types/llm'

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
  | {
      status: 'embedding-success'
      query: string
      hits: SearchHit[]
      embeddingModel: string
      latencyMs: number
      totalTokens: number
    }
  | {
      status: 'rag-success'
      retrieved: SearchHit[]
      output: string
      query: string
      embeddingModel: string
      chatModel: string
      latencyMs: number
      embedTokens: number
      chatPromptTokens: number
      chatCompletionTokens: number
    }
  | {
      status: 'agent-success'
      steps: AgentStep[]
      finalAnswer: string
      iterationsUsed: number
      latencyMs: number
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
        {state.status === 'embedding-success' && <SearchHits state={state} />}
        {state.status === 'rag-success' && <RagResultView state={state} />}
        {state.status === 'agent-success' && <AgentTrace state={state} />}
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
      {state.status === 'embedding-success' && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs">
          <Badge variant="outline" className="font-mono">
            {state.embeddingModel}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.latencyMs}ms</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.totalTokens} tokens</span>
        </div>
      )}
      {state.status === 'rag-success' && (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2 text-xs">
          <Badge variant="outline" className="font-mono">
            embed: {state.embeddingModel}
          </Badge>
          <Badge variant="outline" className="font-mono">
            chat: {state.chatModel}
          </Badge>
          <span className="text-muted-foreground">{state.latencyMs}ms</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            embed {state.embedTokens} · chat {state.chatPromptTokens} → {state.chatCompletionTokens}
          </span>
        </div>
      )}
      {state.status === 'agent-success' && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs">
          <Badge variant="outline" className="font-mono">
            {state.model}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.latencyMs}ms</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{state.iterationsUsed} iterations</span>
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
    case 'embedding-success':
    case 'rag-success':
    case 'agent-success':
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

// ── 임베딩 검색 결과 ──────────────────────────────
function SearchHits({
  state,
}: {
  state: Extract<RunState, { status: 'embedding-success' }>
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Query: <code className="rounded bg-muted px-1">{state.query}</code> · 상위 {state.hits.length}건
      </p>
      <ol className="space-y-2">
        {state.hits.map((hit) => (
          <li
            key={hit.index}
            className="rounded-md border bg-card p-3 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="font-mono">
                #{hit.index + 1}
              </Badge>
              <ScoreBar score={hit.score} />
            </div>
            <p className="mt-1.5 leading-relaxed">{hit.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  // 코사인은 [-1, 1]이지만 실용적으로 [0, 1] 영역 강조 — 음수는 0으로 클램프
  const clamped = Math.max(0, Math.min(1, score))
  const pct = Math.round(clamped * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{score.toFixed(3)}</span>
    </div>
  )
}

// ── RAG 결과 ──────────────────────────────
function RagResultView({
  state,
}: {
  state: Extract<RunState, { status: 'rag-success' }>
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          질문
        </h4>
        <p className="rounded-md border bg-muted/50 p-2.5 text-xs">{state.query}</p>
      </div>
      <details open className="rounded-md border bg-card">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
          📚 검색된 컨텍스트 ({state.retrieved.length}개) — 모델에 전달된 자료
        </summary>
        <ol className="space-y-1.5 px-3 pb-3 text-xs">
          {state.retrieved.map((r) => (
            <li key={r.index} className="rounded border bg-muted/30 p-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  #{r.index + 1}
                </Badge>
                <ScoreBar score={r.score} />
              </div>
              <p className="mt-1 leading-relaxed">{r.text}</p>
            </li>
          ))}
        </ol>
      </details>
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          🤖 답변
        </h4>
        <pre className="whitespace-pre-wrap break-words rounded-md border bg-card p-3 font-sans text-sm">
          {state.output}
        </pre>
      </div>
    </div>
  )
}

// ── Agent trace ──────────────────────────────
function AgentTrace({
  state,
}: {
  state: Extract<RunState, { status: 'agent-success' }>
}) {
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {state.steps.map((step) => (
          <li key={step.iteration} className="rounded-md border bg-card text-xs">
            <div className="border-b bg-muted/40 px-3 py-1.5 font-medium">
              Step {step.iteration}
            </div>
            <div className="space-y-2 p-3">
              {step.assistantContent && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    💬 assistant
                  </div>
                  <p className="mt-0.5 leading-relaxed">{step.assistantContent}</p>
                </div>
              )}
              {step.toolCalls.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    🔧 tool calls
                  </div>
                  <ul className="mt-1 space-y-1">
                    {step.toolCalls.map((tc) => (
                      <li key={tc.id} className="rounded bg-muted/30 p-1.5 font-mono">
                        {tc.name}({tc.arguments})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {step.toolResults.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    📤 tool results
                  </div>
                  <ul className="mt-1 space-y-1">
                    {step.toolResults.map((r, i) => (
                      <li key={i} className="rounded bg-muted/30 p-1.5">
                        <span className="font-mono text-muted-foreground">{r.name}:</span>{' '}
                        {r.result}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="rounded-md border-2 border-primary/30 bg-card p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          ✅ 최종 답변
        </div>
        <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm">
          {state.finalAnswer}
        </pre>
      </div>
    </div>
  )
}
