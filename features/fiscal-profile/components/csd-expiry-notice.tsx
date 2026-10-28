import Link from 'next/link'

import { cn } from '@/lib/utils'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { formatDateLong } from '@shared/utils/date'

import type { PublicIssuingProfile } from '../types/fiscal-profile.types'
import { csdDaysLeftLabel, csdExpiry, type CsdExpiry } from '../utils/csd-expiry'
import { CsdRenewalGuide } from './csd-renewal-guide'

interface CsdExpiryNoticeProps {
  profiles: Pick<PublicIssuingProfile, 'id' | 'rfc' | 'hasCsd' | 'certValidUntil'>[]
}

function noticeText(expiry: Exclude<CsdExpiry, { state: 'vigente' }>, validUntil: string, whose: string): string {
  if (expiry.state === 'vencido') {
    return `${whose} venció el ${formatDateLong(validUntil)}: no puedes timbrar hasta que subas uno nuevo.`
  }
  const when = expiry.daysLeft <= 1 ? csdDaysLeftLabel(expiry.daysLeft) : `${csdDaysLeftLabel(expiry.daysLeft)}, el ${formatDayLong(expiry.lastDay)}`
  return `${whose} ${when}. Tramita uno nuevo y súbelo para no dejar de timbrar.`
}

/** In Inicio: one line per CSD that expires within 30 days or already expired, with what to do about it. */
export function CsdExpiryNotice({ profiles }: CsdExpiryNoticeProps) {
  const now = new Date()
  const notices = profiles.flatMap((profile) => {
    if (!profile.hasCsd || !profile.certValidUntil) return []
    const expiry = csdExpiry(profile.certValidUntil, now)
    return expiry.state === 'vigente' ? [] : [{ profile, validUntil: profile.certValidUntil, expiry }]
  })
  if (notices.length === 0) return null

  return (
    <div className="space-y-2">
      {notices.map(({ profile, validUntil, expiry }) => {
        const expired = expiry.state === 'vencido'
        const whose = profiles.length > 1 ? `Tu CSD de ${profile.rfc}` : 'Tu CSD'
        return (
          <div
            key={profile.id}
            role={expired ? 'alert' : 'status'}
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[4px] border-l-2 bg-hoja px-4 py-2.5 shadow-[var(--shadow-hoja)]',
              expired ? 'border-tinta-roja' : 'border-ocre',
            )}
          >
            <p className={cn('text-[13px]', expired ? 'font-medium text-tinta-roja' : 'text-tinta')}>
              {noticeText(expiry, validUntil, whose)}
            </p>
            <div className="flex items-center gap-4">
              <CsdRenewalGuide />
              <Link href="/fiscal-profiles" className="text-[13px] font-medium text-sello underline-offset-4 hover:underline">
                Subir CSD nuevo
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
