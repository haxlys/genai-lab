import { createFileRoute, notFound } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { getLesson, getLessonSummary } from '#/lib/content'

export const Route = createFileRoute('/lessons/$lessonId')({
  component: LessonPage,
  loader: async ({ params }) => {
    const summary = getLessonSummary(params.lessonId)
    if (!summary) throw notFound()
    const lesson = await getLesson(params.lessonId)
    if (!lesson) throw notFound()
    return { lesson }
  },
})

function LessonPage() {
  const { lesson } = Route.useLoaderData()

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-mono">
            {String(lesson.number).padStart(2, '0')}
          </Badge>
          <Badge>{lesson.type}</Badge>
          {lesson.weekRecommended && <Badge variant="secondary">{lesson.weekRecommended}주차</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.titleEn}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-muted-foreground">
            본 레슨의 한국어 마크다운 본문(<code>{lesson.contentMarkdown.length}자</code>) 렌더링은
            Phase 2에서 react-markdown으로 구현됩니다. 우측 인터랙티브 패널도 Phase 2에서 추가됩니다.
          </p>
        </article>
        <aside className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold">인터랙티브 패널</h2>
          <p className="text-sm text-muted-foreground">
            {lesson.hasVariableSpec
              ? '레슨별 변수 폼이 여기에 표시됩니다.'
              : '이 레슨은 개념 학습용입니다. Playground에서 자유 실험을 하거나 다음 레슨으로 넘어가세요.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
