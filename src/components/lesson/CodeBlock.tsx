/**
 * Shiki 기반 코드 블록 — 클라이언트 사이드에서 lazy-load 후 syntax highlighting.
 *
 * fine-grained import로 사용 언어/테마만 번들에 포함시켜 8MB+ 사이즈를 절감.
 * 새 lang 필요 시: langs 배열에 `import('shiki/langs/<lang>.mjs')` 추가.
 *
 * engine: oniguruma의 wasm 대신 JS regex (`engine-javascript`)를 사용해
 * wasm 파일 의존성을 제거. 일부 정밀도 손실이 있을 수 있으나 학습 코드 범위에서는 충분.
 */

import { useEffect, useState } from 'react'

type SupportedLang = 'python' | 'typescript' | 'javascript' | 'plaintext'

let highlighterPromise: Promise<{
  codeToHtml: (code: string, options: { lang: string; themes: { light: string; dark: string } }) => string
}> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
      ])
      const highlighter = await createHighlighterCore({
        themes: [
          import('shiki/themes/github-dark.mjs'),
          import('shiki/themes/github-light.mjs'),
        ],
        langs: [
          import('shiki/langs/python.mjs'),
          import('shiki/langs/typescript.mjs'),
          import('shiki/langs/javascript.mjs'),
        ],
        engine: createJavaScriptRegexEngine(),
      })
      return {
        codeToHtml: (code, options) => highlighter.codeToHtml(code, options),
      }
    })()
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
