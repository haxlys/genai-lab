import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

const WEEKS: Array<{
  week: 1 | 2 | 3 | 4
  title: string
  blurb: string
  lessons: string[]
}> = [
  {
    week: 1,
    title: '기초 — 프롬프트 마스터',
    blurb: '환경 검증부터 첫 빌드까지. 06번에서 첫 LLM 호출 성공이 목표.',
    lessons: ['01', '04', '05', '06'],
  },
  {
    week: 2,
    title: '인터랙션 — 실제 앱처럼',
    blurb: '챗 히스토리, 이미지 생성, Function Calling을 차례로 학습.',
    lessons: ['07', '09', '11', '12'],
  },
  {
    week: 3,
    title: '검색·RAG — 실무 핵심',
    blurb: '임베딩 검색과 RAG로 본인 문서 Q&A 시스템 구축.',
    lessons: ['08', '15', '17'],
  },
  {
    week: 4,
    title: '프로덕션 — 안전하게 출시',
    blurb: '책임 있는 AI, 보안, 라이프사이클을 실제 빌드 후 학습.',
    lessons: ['03', '13', '14', '18'],
  },
]

function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <header className="mb-12">
        <Badge variant="secondary" className="mb-4">
          Generative AI for Beginners · 한국어 학습 실험실
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          코드 편집 없이, 변수만 바꿔서
          <br />
          LLM을 체감하세요
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Microsoft 공식 코스 22개 레슨을 한국어로 따라가며, 슬라이더와 폼으로
          temperature/모델/프롬프트를 직접 조정해 결과 차이를 비교할 수 있는
          학습 실험실입니다.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link to="/lessons">레슨 시작하기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/playground">자유 실험실로 가기</Link>
          </Button>
        </div>
      </header>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">권장 학습 경로 (4주)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {WEEKS.map((w) => (
            <Card key={w.week}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{w.week}주차</CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {w.lessons.map((id) => (
                      <Badge key={id} variant="outline">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  {w.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{w.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
