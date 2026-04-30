import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Sparkles } from 'lucide-react'

import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/playground', label: 'Playground' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
] as const

export function AppHeader() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform || navigator.userAgent))
  }, [])
  const triggerSearch = () => {
    // SearchCommand가 ⌘K/Ctrl+K window 핸들러로 토글하므로 그대로 dispatch
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }),
    )
  }
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4" />
          genai-lab
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerSearch}
            className="hidden items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent sm:flex"
            aria-label="레슨 검색"
          >
            <Search className="h-3.5 w-3.5" />
            <span>레슨 검색</span>
            <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px]">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: 'bg-accent text-foreground' }}
                activeOptions={{ exact: item.to === '/' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
