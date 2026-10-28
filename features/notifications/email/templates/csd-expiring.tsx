import { Button, Link, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'

interface CsdExpiringEmailProps {
  rfc: string
  /** "vence en 30 días", "vence mañana" */
  daysLeftLabel: string
  /** "12 de noviembre de 2026" */
  lastDayLabel: string
  profilesUrl: string
  /** The SAT's trámite for a new CSD. */
  requestUrl: string
}

const mono = { fontFamily: '"IBM Plex Mono", Menlo, monospace' }
const stepStyle = { fontSize: '14px', lineHeight: '22px', color: '#141414', margin: '0 0 8px 0' }

/** To the user, 30, 7 and 1 days before their CSD expires: when it stops working and how to get a new one. */
export function CsdExpiringEmail({ rfc, daysLeftLabel, lastDayLabel, profilesUrl, requestUrl }: CsdExpiringEmailProps) {
  const title = `Tu CSD ${daysLeftLabel}`

  return (
    <EmailLayout preview={title}>
      <Preview>{title}</Preview>

      <Section style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '32px' }}>
        <EmailHeader />

        <Text style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: '0 0 8px 0' }}>{title}</Text>
        <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 20px 0' }}>
          El Certificado de Sello Digital de <span style={mono}>{rfc}</span> deja de funcionar el {lastDayLabel}. Después
          de esa fecha no podrás timbrar con ese RFC hasta que subas uno nuevo.
        </Text>

        <Text style={{ fontSize: '14px', fontWeight: '600', color: '#141414', margin: '0 0 8px 0' }}>
          Tramitarlo es gratis y se hace en línea, con tu e.firma vigente:
        </Text>
        <Text style={stepStyle}>
          1. En la aplicación Certifica del SAT, genera la solicitud del CSD. Te da un archivo .sdg y tu nueva llave .key, con
          la contraseña que elijas.
        </Text>
        <Text style={stepStyle}>2. Entra a CertiSAT Web con tu e.firma y envía el archivo .sdg.</Text>
        <Text style={{ ...stepStyle, margin: '0 0 20px 0' }}>
          3. Cuando esté listo, descarga tu certificado .cer en «Seguimiento de la solicitud» y súbelo en FacturaFast con la
          llave .key y su contraseña.
        </Text>

        <Button
          href={profilesUrl}
          style={{ backgroundColor: '#2f4ba8', color: '#ffffff', borderRadius: '6px', padding: '10px 18px', fontSize: '14px', fontWeight: '600' }}
        >
          Subir mi CSD nuevo
        </Button>

        <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#5e5e66', margin: '24px 0 0 0', borderTop: '1px solid #e5e5ea', paddingTop: '16px' }}>
          Los pasos están en el <Link href={requestUrl} style={{ color: '#2f4ba8' }}>trámite del SAT</Link>.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default CsdExpiringEmail
