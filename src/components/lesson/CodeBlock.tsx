/**
 * Shiki 기반 코드 블록 — 클라이언트 사이드에서 lazy-load 후 syntax highlighting.
 * Python, TypeScript, JavaScript만 등록 (사이즈 최소화).
 */

import { useEffect, useState } from 'react'

type SupportedLang = 'python' | 'typescript' | 'javascript' | 'plaintext'

let highlighterPromise: Promise<{
  codeToHtml: (code: string, options: { lang: string; themes: { light: string; dark: string } }) => string
}> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(async ({ createHighlighter }) => {
      const highlighter = await createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: ['python', 'typescript', 'javascript'],
      })
      return {
        codeToHtml: (code, options) => highlighter.codeToHtml(code, options),
      }
    })
  }
  return highlighterPromise
}

export function CodeBlock({ code, lang }: { code: string; lang: SupportedLang }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (lang === 'plaintext') {
      setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
      return
    }
    getHighlighter()
      .then((highlighter) => {
        if (!mounted) return
        const out = highlighter.codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
        })
        setHtml(out)
      })
      .catch((err) => {
        console.warn('Shiki highlight failed:', err)
        if (mounted) setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
      })
    return () => {
      mounted = false
    }
  }, [code, lang])

  if (html === null) {
    return (
      <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
        <code className="text-muted-foreground">로딩 중…</code>
      </pre>
    )
  }

  return (
    <div
      className="shiki-block overflow-auto rounded-md text-xs [&_pre]:!m-0 [&_pre]:!bg-muted [&_pre]:!p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}
