import { Link, Section, Text } from '@react-email/components'

// TODO: Reemplazar URLs con las redes sociales reales de FacturaFast
const SOCIAL_LINKS = {
  linkedin: 'https://linkedin.com/company/facturafast',
  instagram: 'https://instagram.com/facturafast',
  x: 'https://x.com/facturafast',
}

interface EmailFooterProps {
  businessName?: string
}

export function EmailFooter({ businessName }: EmailFooterProps) {
  return (
    <Section
      style={{
        borderTop: '1px solid #e4e4e7',
        paddingTop: '20px',
        marginTop: '32px',
      }}
    >
      {/* Social links */}
      <Section style={{ textAlign: 'center', margin: '0 0 16px 0' }}>
        <Link
          href={SOCIAL_LINKS.linkedin}
          style={{ color: '#868da6', textDecoration: 'none', fontSize: '13px', margin: '0 12px' }}
        >
          LinkedIn
        </Link>
        <Link
          href={SOCIAL_LINKS.instagram}
          style={{ color: '#868da6', textDecoration: 'none', fontSize: '13px', margin: '0 12px' }}
        >
          Instagram
        </Link>
        <Link
          href={SOCIAL_LINKS.x}
          style={{ color: '#868da6', textDecoration: 'none', fontSize: '13px', margin: '0 12px' }}
        >
          X
        </Link>
      </Section>

      {businessName && (
        <Text
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            color: '#868da6',
            textAlign: 'center',
            margin: '0 0 8px 0',
          }}
        >
          Emitida por {businessName}
        </Text>
      )}

      <Text
        style={{
          fontSize: '11px',
          lineHeight: '16px',
          color: '#a1a1aa',
          textAlign: 'center',
          margin: '0',
        }}
      >
        Generado con FacturaFast — Facturación electrónica CFDI 4.0
      </Text>
    </Section>
  )
}
