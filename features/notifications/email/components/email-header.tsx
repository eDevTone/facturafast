import { Section, Text } from '@react-email/components'

// TODO: Reemplazar con imagen real del logo cuando se tenga
// Ejemplo: <Img src="https://facturafast.com/logo.png" width="150" height="auto" alt="FacturaFast" />

export function EmailHeader() {
  return (
    <Section style={{ paddingBottom: '24px' }}>
      {/* The FF stamp mark, drawn with a bordered inline box (images are often blocked in mail clients) */}
      <Text style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#141414' }}>
        <span
          style={{
            display: 'inline-block',
            border: '1.5px solid #2f4ba8',
            borderRadius: '6px',
            padding: '2px 6px',
            marginRight: '8px',
            color: '#2f4ba8',
            fontFamily: '"IBM Plex Mono", Menlo, monospace',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          FF
        </span>
        FacturaFast
      </Text>
    </Section>
  )
}
