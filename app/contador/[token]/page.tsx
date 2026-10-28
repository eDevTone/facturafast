import { SharedPackageMonths } from '@features/accountant/components/shared-package-months'
import { resolveAccountantToken } from '@features/accountant/services/accountant-link.service'
import { getMonthCounts, withCounts } from '@features/accountant/services/month-package.service'
import { monthsBetween } from '@features/accountant/utils/month'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { Logo } from '@shared/components/logo'
import { monthOf } from '@shared/utils/day'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Facturas para tu contabilidad · FacturaFast',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/**
 * "Link para tu contador": the months of one issuing profile, without signing in. The token is
 * checked here and again on every download.
 */
export default async function AccountantPackagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const owner = await resolveAccountantToken(token)

  return (
    <main className="min-h-screen bg-papel px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-6">
        <Logo />
        {owner ? <Package token={token} owner={owner} /> : <LinkGone />}
      </div>
    </main>
  )
}

async function Package({ token, owner }: { token: string; owner: { userId: string; profileId: string; businessName: string; rfc: string } }) {
  const counts = await getMonthCounts(owner.userId, owner.profileId)
  const current = monthOf(todayInMexico())
  const first = [...counts.keys()].sort()[0] ?? current
  const months = withCounts(monthsBetween(first < current ? first : current, current), counts)

  return (
    <>
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Facturas de {owner.businessName}</h1>
        <p className="mt-1 text-sm text-tinta-tenue">
          RFC <span className="font-mono text-tinta">{owner.rfc}</span>. Cada mes trae los XML y PDF de lo timbrado, cancelados
          incluidos, y un resumen que abre en Excel.
        </p>
      </header>

      <SharedPackageMonths token={token} months={months} />

      <p className="text-[12px] text-tinta-tenue">
        {owner.businessName} te compartió este link desde FacturaFast. Si dejas de llevar su contabilidad, pídele que lo cancele.
      </p>
    </>
  )
}

function LinkGone() {
  return (
    <div className="hoja-borrador px-6 py-12 text-center">
      <h1 className="text-base font-semibold">Este link ya no funciona</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
        Puede que tu cliente lo haya cancelado o que esté incompleto. Pídele uno nuevo.
      </p>
    </div>
  )
}
