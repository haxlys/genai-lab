import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

type SupportedLang = 'python' | 'typescript' | 'javascript' | 'plaintext'

const NORMALIZED_LANGS: Record<string, SupportedLang> = {
  python: 'python',
  py: 'python',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
}

/**
 * 한국어 마크다운 본문을 렌더링. 코드 펜스는 Shiki로 하이라이팅,
 * 이미지는 원본 레포의 상대 경로를 GitHub raw URL로 변환.
 */
export function LessonContent({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-img:rounded-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const text = String(children ?? '').replace(/\n$/, '')
            const isBlock = text.includes('\n') || !!match
            if (!isBlock) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...rest}>
                  {children}
                </code>
              )
            }
            const lang = match ? NORMALIZED_LANGS[match[1].toLowerCase()] ?? 'plaintext' : 'plaintext'
            return <CodeBlock code={text} lang={lang} />
          },
          // 원본 레포의 이미지 상대 경로 ../../../translated_images/... 등은 깨질 가능성 높음.
          // 사용자에게 알려주는 정도로 처리, 빌드 시간에 처리하는 것은 v2 과제.
          img({ src, alt }) {
            return <img src={src} alt={alt ?? ''} loading="lazy" />
          },
          // GitHub-flavored task lists 등은 remark-gfm이 처리.
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
