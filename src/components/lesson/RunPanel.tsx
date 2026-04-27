import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Square, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { VariableForm } from './VariableForm'
import { OutputPanel, type RunState } from './OutputPanel'

import { generateImage, runAgent, runEmbeddingSearch, runRag, streamChat } from '#/lib/llm'
import { saveRun } from '#/lib/storage/runs'
import { getKeyForProvider, getSettings } from '#/lib/storage/settings'
import type { VariableSpec } from '#/types/lesson'
import type {
  AgentRequest,
  ChatRequest,
  RagRequest,
  SearchRequest,
} from '#/types/llm'
import type { ImageRequest } from '#/types/image'

/**
 * 레슨/Playground에서 공통 사용하는 Run 패널.
 * spec.kind에 따라 5가지 흐름 분기: chat / image / embedding / rag / agent.
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

  useEffect(() => {
    if (initialValues) setRestoreFromPreset(initialValues)
  }, [initialValues])

  const handleRun = useCallback(async () => {
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
      const kind = spec.kind ?? 'chat'

      if (kind === 'image') {
        const imageRequest = request as ImageRequest
        const result = await generateImage(imageRequest, {
          apiKey,
          signal: abortRef.current.signal,
        })
        setState({
          status: 'image-success',
          images: result.images,
          latencyMs: result.latencyMs,
          model: result.model,
          promptUsed: imageRequest.prompt,
        })
        const summary = result.images
          .map((img, i) => `[image ${i + 1}] ${img.url ?? '(b64 inline)'}${img.revised_prompt ? `\n  revised: ${img.revised_prompt}` : ''}`)
          .join('\n')
        saveRun({
          lessonId,
          inputs: values,
          output: summary,
          metadata: {
            provider: imageRequest.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            promptTokens: 0,
            completionTokens: 0,
          },
        })
      } else if (kind === 'embedding') {
        const searchRequest = request as SearchRequest
        const result = await runEmbeddingSearch({
          apiKey,
          signal: abortRef.current.signal,
          model: searchRequest.model,
          query: searchRequest.query,
          corpus: searchRequest.corpus,
          topK: searchRequest.topK,
        })
        setState({
          status: 'embedding-success',
          query: result.query,
          hits: result.hits,
          embeddingModel: result.embeddingModel,
          latencyMs: result.latencyMs,
          totalTokens: result.totalTokens,
        })
        const summary = result.hits
          .map((h) => `#${h.index + 1} (${h.score.toFixed(3)}) ${h.text.slice(0, 80)}`)
          .join('\n')
        saveRun({
          lessonId,
          inputs: values,
          output: summary,
          metadata: {
            provider: searchRequest.provider,
            model: result.embeddingModel,
            latencyMs: result.latencyMs,
            promptTokens: result.totalTokens,
            completionTokens: 0,
          },
        })
      } else if (kind === 'rag') {
        const ragRequest = request as RagRequest
        const result = await runRag(ragRequest, {
          apiKey,
          signal: abortRef.current.signal,
          onChunk: (delta) => {
            setState((prev) => {
              if (prev.status !== 'running') return prev
              return { status: 'running', partial: prev.partial + delta }
            })
          },
        })
        setState({
          status: 'rag-success',
          retrieved: result.retrieved,
          output: result.output,
          query: ragRequest.query,
          embeddingModel: result.embeddingModel,
          chatModel: result.chatModel,
          latencyMs: result.totalLatencyMs,
          embedTokens: result.embedTokens,
          chatPromptTokens: result.chatPromptTokens,
          chatCompletionTokens: result.chatCompletionTokens,
        })
        const summary = `[검색된 ${result.retrieved.length}개]\n${result.retrieved
          .map((h, i) => `[${i + 1}] (${h.score.toFixed(2)}) ${h.text.slice(0, 60)}`)
          .join('\n')}\n\n[답변]\n${result.output}`
        saveRun({
          lessonId,
          inputs: values,
          output: summary,
          metadata: {
            provider: ragRequest.provider,
            model: `${result.embeddingModel} + ${result.chatModel}`,
            latencyMs: result.totalLatencyMs,
            promptTokens: result.chatPromptTokens,
            completionTokens: result.chatCompletionTokens,
          },
        })
      } else if (kind === 'agent') {
        const agentRequest = request as AgentRequest
        const result = await runAgent(agentRequest, {
          apiKey,
          signal: abortRef.current.signal,
        })
        setState({
          status: 'agent-success',
          steps: result.steps,
          finalAnswer: result.finalAnswer,
          iterationsUsed: result.iterationsUsed,
          latencyMs: result.totalLatencyMs,
          model: result.model,
        })
        const summary = `[${result.iterationsUsed} iterations]\n` +
          result.steps
            .map((s) => `step ${s.iteration}: ${s.toolCalls.length} tool call(s) → ${s.toolResults.map((r) => r.name).join(', ') || '(none)'}`)
            .join('\n') +
          `\n\n[최종]\n${result.finalAnswer}`
        saveRun({
          lessonId,
          inputs: values,
          output: summary,
          metadata: {
            provider: agentRequest.provider,
            model: result.model,
            latencyMs: result.totalLatencyMs,
            promptTokens: 0,
            completionTokens: 0,
          },
        })
      } else {
        // chat (default)
        const chatRequest = request as ChatRequest
        const result = await streamChat(chatRequest, {
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
        const toolCallSection = result.toolCalls?.length
          ? `\n\n──── Tool calls (${result.toolCalls.length}) ────\n` +
            result.toolCalls
              .map((tc, i) => `[${i + 1}] ${tc.name}\n  args: ${tc.arguments}`)
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
        saveRun({
          lessonId,
          inputs: values,
          output: finalOutput,
          metadata: {
            provider: chatRequest.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
          },
        })
      }

      onRunComplete?.()
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState({ status: 'idle' })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      setState({ status: 'error', message })
      const r = spec.buildRequest(values)
      saveRun({
        lessonId,
        inputs: values,
        output: '',
        metadata: {
          provider: r.provider,
          model: 'model' in r ? r.model : 'unknown',
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
