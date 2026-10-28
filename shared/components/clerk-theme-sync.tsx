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
          // Clerk needs literal colors: the stamp blue of each mode.
          colorPrimary: isDark ? '#8fa4f0' : '#2f4ba8',
          colorSuccess: isDark ? '#8fa4f0' : '#2f4ba8',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
