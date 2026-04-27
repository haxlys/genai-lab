import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { CodeBlock } from './CodeBlock'

/**
 * 레슨 페이지 좌측 상단에 표시되는 "강의 코드" 카드.
 * Python 원본 / TypeScript 등가 / genai-lab이 실제 실행하는 TS 등가를 탭으로 전환.
 */
export function LessonCode({
  pythonReference,
  typescriptReference,
  typescriptSnippet,
}: {
  pythonReference: string | null
  typescriptReference: string | null
  /** lesson-spec이 합성한 "실제로 실행되는" TS 코드 (있으면 우선) */
  typescriptSnippet?: string
}) {
  const tsCode = typescriptSnippet ?? typescriptReference
  const hasPython = !!pythonReference
  const hasTs = !!tsCode

  if (!hasPython && !hasTs) return null

  // 기본 탭은 Python 우선 (학습은 원본 코드부터)
  const defaultTab = hasPython ? 'python' : 'typescript'

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-2.5 text-sm font-medium">강의 코드</div>
      <Tabs defaultValue={defaultTab} className="p-3">
        <TabsList className="mb-2">
          {hasPython && <TabsTrigger value="python">Python (원본)</TabsTrigger>}
          {hasTs && (
            <TabsTrigger value="typescript">
              TypeScript ({typescriptSnippet ? '실행 코드' : '예제'})
            </TabsTrigger>
          )}
        </TabsList>
        {hasPython && (
          <TabsContent value="python">
            <CodeBlock code={pythonReference!} lang="python" />
          </TabsContent>
        )}
        {hasTs && (
          <TabsContent value="typescript">
            <CodeBlock code={tsCode!} lang="typescript" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
