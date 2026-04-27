import { createFileRoute } from '@tanstack/react-router'
import { PlaygroundPanel } from '#/components/playground/PlaygroundPanel'

export const Route = createFileRoute('/playground')({ component: Playground })

function Playground() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Playground</h1>
        <p className="mt-2 text-muted-foreground">
          레슨과 무관한 자유 실험실. 모델/프롬프트/파라미터를 자유롭게 조합하고 결과를 비교하세요.
        </p>
      </header>
      <PlaygroundPanel />
    </div>
  )
}
