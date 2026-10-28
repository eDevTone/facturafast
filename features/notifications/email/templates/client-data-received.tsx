import { Button, Link, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'

interface ClientDataReceivedEmailProps {
  clientName: string
  rfc: string
  /** The link was for a client the user already had. */
  updated: boolean
  clientUrl: string
  invoiceUrl: string
}

/** To the user: the client they sent the link to typed their fiscal data. */
export function ClientDataReceivedEmail({ clientName, rfc, updated, clientUrl, invoiceUrl }: ClientDataReceivedEmailProps) {
  const title = `${clientName} ${updated ? 'actualizó' : 'llenó'} sus datos fiscales`

  return (
    <EmailLayout preview={title}>
      <Preview>{title}</Preview>

      <Section style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '32px' }}>
        <EmailHeader />

        <Text style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: '0 0 8px 0' }}>{title}</Text>
        <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 20px 0' }}>
          Ya quedaron en tus clientes, con el RFC{' '}
          <span style={{ fontFamily: '"IBM Plex Mono", Menlo, monospace' }}>{rfc}</span>. Ya puedes facturarle.
        </Text>

        <Button
          href={invoiceUrl}
          style={{ backgroundColor: '#2f4ba8', color: '#ffffff', borderRadius: '6px', padding: '10px 18px', fontSize: '14px', fontWeight: '600' }}
        >
          Hacerle una factura
        </Button>

        <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#5e5e66', margin: '24px 0 0 0', borderTop: '1px solid #e5e5ea', paddingTop: '16px' }}>
          Revisa lo que escribió en <Link href={clientUrl} style={{ color: '#2f4ba8' }}>Clientes</Link>. El link que le mandaste ya no
          funciona.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default ClientDataReceivedEmail
