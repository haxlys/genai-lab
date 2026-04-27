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

const SOURCE_REPO_RAW_BASE =
  'https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/main/'

/**
 * 원본 레포의 한국어 README는 이미지를 ../../../translated_images/ko/foo.webp 식으로
 * 참조한다 (translations/ko/<id>/README.md 기준). 우리 페이지는 그 위치가 아니므로
 * 상대 경로를 GitHub raw URL로 다시 앵커링한다. 절대 URL은 그대로 둔다.
 */
function resolveImageSrc(src: string | undefined): string | undefined {
  if (!src) return src
  if (/^(https?:|data:|blob:)/.test(src)) return src
  const stripped = src.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '')
  return `${SOURCE_REPO_RAW_BASE}${stripped}`
}

/**
 * 한국어 마크다운 본문을 렌더링. 코드 펜스는 Shiki로 하이라이팅,
 * 이미지는 원본 레포의 상대 경로를 GitHub raw URL로 변환.
 */
export function LessonContent({ markdown }: { markdown: string }) {
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
                src={resolveImageSrc(typeof src === 'string' ? src : undefined)}
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
