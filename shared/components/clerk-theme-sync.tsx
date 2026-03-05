'use client'

import { useTheme } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { clerkLocalization, clerkAppearance } from '@/lib/clerk-config'

export function ClerkThemeSync({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        ...clerkAppearance,
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  )
}
