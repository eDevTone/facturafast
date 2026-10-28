import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAllIssuingProfiles } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getTaxRegimeOptions } from '@shared/services/sat-catalog.service'
import { getFileSignedUrl } from '@features/storage/services/r2.service'
import { FiscalProfilesClient } from './fiscal-profiles-client'

export default async function FiscalProfilesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [profiles, taxRegimes] = await Promise.all([
    getAllIssuingProfiles(userId),
    getTaxRegimeOptions(),
  ])

  // Resolve logo signed URLs for profiles that have logos
  const logoUrls: Record<string, string> = {}
  await Promise.all(
    profiles
      .filter(p => p.logoUrl)
      .map(async p => {
        try { logoUrls[p.id] = await getFileSignedUrl(p.logoUrl!) } catch { /* ignore */ }
      })
  )

  return (
    <FiscalProfilesClient profiles={profiles} taxRegimes={taxRegimes} logoUrls={logoUrls} />
  )
}
