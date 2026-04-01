import {
  Body,
  Container,
  Head,
  Html,
  Tailwind,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface EmailLayoutProps {
  children: ReactNode
  preview: string
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body
          style={{
            fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
            backgroundColor: '#f4f4f5',
            margin: 0,
            padding: 0,
          }}
        >
          <Container
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              padding: '40px 24px',
            }}
          >
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
