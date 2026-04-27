import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/playground')({ component: Playground })

function Playground() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">Playground</h1>
      <p className="mt-4 text-muted-foreground">
        자유 실험실 — Phase 4에서 구현됩니다.
      </p>
    </div>
  )
}
