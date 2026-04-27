import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({ component: Settings })

function Settings() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-4 text-muted-foreground">
        API 키 입력 — Phase 2에서 구현됩니다.
      </p>
    </div>
  )
}
