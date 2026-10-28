import { PublicClientForm } from '@features/clients/components/public-client-form'
import { resolveClientRequest } from '@features/clients/services/client-request.service'
import { Logo } from '@shared/components/logo'
import { getCfdiUsageOptions, getTaxRegimeOptions } from '@shared/services/sat-catalog.service'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tus datos fiscales · FacturaFast',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/**
 * "Pedir datos a un cliente": the client types their fiscal data, without an account. The page
 * shows only the name of the business that asks; the token is checked here and on every action.
 */
export default async function ClientDataPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const resolved = await resolveClientRequest(token)

  return (
    <main className="min-h-screen bg-papel px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-6">
        <Logo />
        {resolved ? <Request token={token} businessName={resolved.businessName} updating={!!resolved.request.clientId} /> : <LinkGone />}
      </div>
    </main>
  )
}

async function Request({ token, businessName, updating }: { token: string; businessName: string; updating: boolean }) {
  const [taxRegimes, cfdiUsages] = await Promise.all([getTaxRegimeOptions(), getCfdiUsageOptions()])

  return (
    <>
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {updating ? `${businessName} te pide confirmar tus datos fiscales` : `${businessName} te pide tus datos fiscales`}
        </h1>
        <p className="mt-1 text-sm text-tinta-tenue">
          Son los que van en tus facturas y solo los recibe {businessName}.
        </p>
      </header>
      <PublicClientForm token={token} businessName={businessName} catalogs={{ taxRegimes, cfdiUsages }} />
    </>
  )
}

function LinkGone() {
  return (
    <div className="hoja-borrador px-6 py-12 text-center">
      <h1 className="text-base font-semibold">Este link ya no funciona</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
        Ya se usó, venció o lo cancelaron. Pídele uno nuevo a quien te lo mandó.
      </p>
    </div>
  )
}
