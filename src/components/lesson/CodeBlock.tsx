/**
 * Shiki 기반 코드 블록 — 클라이언트 사이드에서 lazy-load 후 syntax highlighting.
 * Python, TypeScript, JavaScript만 등록 (사이즈 최소화).
 */

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

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
  const [copied, setCopied] = useState(false)

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('clipboard write failed:', err)
    }
  }

  if (html === null) {
    return (
      <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
        <code className="text-muted-foreground">로딩 중…</code>
      </pre>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md border bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={copied ? '복사됨' : '코드 복사'}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <div
        className="shiki-block overflow-auto rounded-md text-xs [&_pre]:!m-0 [&_pre]:!bg-muted [&_pre]:!p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}
