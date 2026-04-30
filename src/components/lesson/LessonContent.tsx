import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import { resolveImageSrc } from '#/lib/image-src'

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
 * 이미지는 원본 레포의 상대 경로를 GitHub raw URL로 변환. imageMap이
 * 주어지면 폴백 매핑을 우선 적용한다 (한국어 번역 이미지 누락 대응).
 */
export function LessonContent({
  markdown,
  imageMap,
}: {
  markdown: string
  imageMap?: Record<string, string>
}) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-img:rounded-md prose-img:border">
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
          img({ src, alt }) {
            return (
              <img
                src={resolveImageSrc(typeof src === 'string' ? src : undefined, imageMap)}
                alt={alt ?? ''}
                loading="lazy"
              />
            )
          },
          // 링크는 외부 링크면 새 창으로 열어 학습 흐름 유지
          a({ href, children, ...rest }) {
            const isExternal = href && /^https?:/.test(href)
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...rest}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
