'use client'

import { Button } from '@/shared/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // True only on the client, so the icon never mismatches the server render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
        <span className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
