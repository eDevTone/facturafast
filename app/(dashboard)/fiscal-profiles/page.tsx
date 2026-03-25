import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAllIssuingProfiles } from '@features/fiscal-profile/services/fiscal-profile.service'
import { FiscalProfilesClient } from './fiscal-profiles-client'

export default async function FiscalProfilesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profiles = await getAllIssuingProfiles(userId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfiles Fiscales (Emisores)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona los RFC desde los que puedes emitir facturas.
        </p>
      </div>
      <FiscalProfilesClient profiles={profiles} />
    </div>
  )
}
