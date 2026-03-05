'use client'

import { useTheme } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { clerkLocalization, clerkAppearance } from '@/lib/clerk-config'

export function ClerkThemeSync({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        ...clerkAppearance,
        baseTheme: isDark ? dark : undefined,
        variables: {
          ...clerkAppearance.variables,
          colorPrimary: isDark ? '#10b981' : '#059669',
          colorSuccess: isDark ? '#10b981' : '#059669',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
