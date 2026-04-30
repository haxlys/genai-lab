/**
 * Cmd+K(/Ctrl+K) 단축키로 열리는 레슨 전문 검색 다이얼로그.
 *
 * 빌드 타임 인덱스(content/search-index.json) 기반 substring 매칭.
 * 외부 라이브러리 없이 자체 입력+결과 리스트 구성.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { Dialog, DialogContent } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { searchLessons, type SearchResult } from '#/lib/search'

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const navigate = useNavigate()

  const results: SearchResult[] = useMemo(() => searchLessons(query, 12), [query])

  // 단축키: ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 다이얼로그 열릴 때 입력/선택 초기화
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  const handleSelect = useCallback(
    (id: string) => {
      setOpen(false)
      navigate({ to: '/lessons/$lessonId', params: { lessonId: id } })
    },
    [navigate],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault()
      handleSelect(results[activeIdx].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="레슨 본문에서 검색 (예: temperature, 환각, RAG)"
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              매칭되는 레슨이 없습니다.
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r.id)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${
                      i === activeIdx ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                        {String(r.number).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.titleEn}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.snippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
