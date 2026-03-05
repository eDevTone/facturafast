'use client'

import { useTheme } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { clerkLocalization } from '@/lib/clerk-config'

export function ClerkThemeSync({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        cssLayerName: 'clerk',
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#10b981',
          fontFamily:
            'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
          borderRadius: '0.5em',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
