import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/lessons/')({ component: LessonsIndex })

function LessonsIndex() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">레슨 목록</h1>
      <p className="mt-4 text-muted-foreground">
        콘텐츠 동기화(<code>pnpm sync-content</code>) 후 22개 레슨 카드가 여기에 나타납니다.
      </p>
    </div>
  )
}
