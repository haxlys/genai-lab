import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { getLessonSummaries } from '#/lib/content'
import type { LessonSummary } from '#/types/lesson'

export const Route = createFileRoute('/lessons/')({
  component: LessonsIndex,
  loader: () => ({ summaries: getLessonSummaries() }),
})

const TYPE_BADGE_VARIANT: Record<LessonSummary['type'], 'default' | 'secondary' | 'outline'> = {
  Setup: 'outline',
  Learn: 'secondary',
  Build: 'default',
}

function LessonsIndex() {
  const { summaries } = Route.useLoaderData()

  // 주차별 그룹화 (null인 옵션 레슨은 별도)
  const byWeek: Record<string, LessonSummary[]> = {
    '1주차': [],
    '2주차': [],
    '3주차': [],
    '4주차': [],
    '선택': [],
  }
  for (const s of summaries) {
    const key = s.weekRecommended ? `${s.weekRecommended}주차` : '선택'
    byWeek[key].push(s)
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">레슨 목록</h1>
        <p className="mt-2 text-muted-foreground">
          22개 레슨을 권장 학습 주차별로 정렬했습니다. 진도와 무관하게 어떤 레슨부터든 시작할 수 있습니다.
        </p>
      </header>

      {Object.entries(byWeek).map(([weekLabel, lessons]) =>
        lessons.length === 0 ? null : (
          <section key={weekLabel} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">{weekLabel}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lessons
                .sort((a, b) => a.number - b.number)
                .map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
            </div>
          </section>
        ),
      )}
    </div>
  )
}

function LessonCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link
      to="/lessons/$lessonId"
      params={{ lessonId: lesson.id }}
      className="block transition-transform hover:scale-[1.01]"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono">
              {String(lesson.number).padStart(2, '0')}
            </Badge>
            <div className="flex gap-1">
              <Badge variant={TYPE_BADGE_VARIANT[lesson.type]}>{lesson.type}</Badge>
              {lesson.hasVariableSpec && <Badge variant="secondary">랩</Badge>}
            </div>
          </div>
          <CardTitle className="text-base leading-tight mt-2">{lesson.title}</CardTitle>
          <CardDescription className="text-xs">{lesson.titleEn}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {lesson.apiCallType === 'none'
              ? '개념 학습'
              : lesson.apiCallType === 'chat'
                ? 'Chat Completions 실험'
                : lesson.apiCallType === 'image'
                  ? '이미지 생성 실험'
                  : lesson.apiCallType === 'embedding'
                    ? '임베딩 검색 실험'
                    : 'Function Calling 실험'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
