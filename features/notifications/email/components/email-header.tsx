import { Section, Text } from '@react-email/components'

// TODO: Reemplazar con imagen real del logo cuando se tenga
// Ejemplo: <Img src="https://facturafast.com/logo.png" width="150" height="auto" alt="FacturaFast" />

export function EmailHeader() {
  return (
    <Section style={{ paddingBottom: '24px' }}>
      <Text
        style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#10b981',
          margin: '0',
          letterSpacing: '-0.5px',
        }}
      >
        FacturaFast
      </Text>
    </Section>
  )
}
