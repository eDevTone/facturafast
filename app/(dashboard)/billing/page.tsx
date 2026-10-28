import { auth } from '@clerk/nextjs/server'
import { BillingPage } from '@features/billing/components/billing-page'
import { getOrCreateAccount, getPurchaseHistory } from '@features/billing/services/account.service'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BillingRoute({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams
  const { userId } = await auth()

  if (!userId) {
    notFound()
  }

  const [account, purchaseHistory] = await Promise.all([
    getOrCreateAccount(userId),
    getPurchaseHistory(userId),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Timbres
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Tu saldo y los paquetes para recargar.</p>
      </div>

      <BillingPage
        stampsBalance={account.stampsBalance}
        purchaseHistory={purchaseHistory}
        paymentSuccess={success === 'true'}
        paymentError={error === 'true'}
      />
    </div>
  )
}
