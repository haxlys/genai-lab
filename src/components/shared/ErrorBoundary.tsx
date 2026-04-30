/**
 * 자체 구현 React Error Boundary.
 * 자식이 렌더 단계에서 throw하면 fallback을 렌더하고 reset 버튼으로 다시 시도.
 *
 * 비동기 throw(예: 이벤트 핸들러나 setTimeout 안에서 발생한 예외)는 React Error
 * Boundary가 잡지 못한다 — 그쪽은 try/catch로 직접 핸들링해야 한다.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'

type Props = {
  children: ReactNode
  /** fallback render. 미지정 시 기본 빨간 박스 사용 */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode
  /** 에러 발생 시 추가 콜백 (로깅 등) */
  onError?: (error: Error, info: ErrorInfo) => void
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // dev에서 디버깅 가능하도록 콘솔 출력 + onError 콜백 호출
    console.error('[ErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.reset })
      }
      return <DefaultFallback error={error} reset={this.reset} />
    }
    return this.props.children
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" />
        예상치 못한 오류가 발생했습니다.
      </div>
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-background/50 p-2 font-mono text-xs text-muted-foreground">
        {error.message || String(error)}
      </pre>
      <Button onClick={reset} variant="outline" size="sm" className="mt-3">
        <RefreshCw className="mr-1.5 h-3 w-3" /> 다시 시도
      </Button>
    </div>
  )
}
