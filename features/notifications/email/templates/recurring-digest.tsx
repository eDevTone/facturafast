import { Link, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'

export interface RecurringDigestRow {
  /** "A-15"; null when no invoice was made. */
  folioLabel: string | null
  clientName: string
  /** Formatted with its currency; null when no invoice was made. */
  total: string | null
  /** What happened, in one sentence: "Borrador listo: revísalo y timbra." */
  status: string
  /** `problem` is shown in red ink: the user has something to fix. */
  tone: 'done' | 'todo' | 'problem'
  url: string
  /** Text of the link: "Revisar y timbrar", "Ver factura". */
  action: string
}

interface RecurringDigestEmailProps {
  /** "1 de noviembre" */
  dateLabel: string
  rows: RecurringDigestRow[]
  listUrl: string
}

const toneColor = { done: '#2f4ba8', todo: '#a86a12', problem: '#b8382a' } as const

/** The daily note of "Facturas de cada mes": what the app made today and what is left to the user. */
export function RecurringDigestEmail({ dateLabel, rows, listUrl }: RecurringDigestEmailProps) {
  const preview = rows.length === 1
    ? `${rows[0].clientName}: ${rows[0].status}`
    : `${rows.length} facturas de cada mes del ${dateLabel}`

  return (
    <EmailLayout preview={preview}>
      <Preview>{preview}</Preview>

      <Section style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '32px' }}>
        <EmailHeader />

        <Text style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: '0 0 8px 0' }}>
          Tus facturas de cada mes
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 20px 0' }}>
          Esto es lo que hicimos hoy, {dateLabel}.
        </Text>

        {rows.map((row, index) => (
          <Section
            key={index}
            style={{ borderTop: '1px solid #e5e5ea', padding: '14px 0' }}
          >
            <Text style={{ fontSize: '14px', color: '#141414', margin: '0', fontWeight: '600' }}>
              {row.folioLabel && (
                <span style={{ fontFamily: '"IBM Plex Mono", Menlo, monospace', color: '#b8382a' }}>{row.folioLabel} </span>
              )}
              {row.clientName}
              {row.total && (
                <span style={{ fontFamily: '"IBM Plex Mono", Menlo, monospace', fontWeight: '400' }}> · {row.total}</span>
              )}
            </Text>
            <Text style={{ fontSize: '14px', lineHeight: '22px', color: toneColor[row.tone], margin: '4px 0 6px 0' }}>
              {row.status}
            </Text>
            <Link href={row.url} style={{ fontSize: '14px', color: '#2f4ba8', textDecoration: 'underline' }}>
              {row.action}
            </Link>
          </Section>
        ))}

        <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#5e5e66', margin: '24px 0 0 0', borderTop: '1px solid #e5e5ea', paddingTop: '16px' }}>
          Puedes cambiar el día, pausar o dejar de repetir una factura en{' '}
          <Link href={listUrl} style={{ color: '#2f4ba8' }}>Facturas de cada mes</Link>.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default RecurringDigestEmail
