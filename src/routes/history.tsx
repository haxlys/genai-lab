import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/history')({ component: History })

function History() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">Run History</h1>
      <p className="mt-4 text-muted-foreground">
        실행 기록 + 비교 — Phase 3에서 구현됩니다.
      </p>
    </div>
  )
}
