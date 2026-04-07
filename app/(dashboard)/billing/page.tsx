import { auth } from '@clerk/nextjs/server'
import { BillingPage } from '@features/billing/components/billing-page'
import { getOrCreateAccount, getPurchaseHistory } from '@features/billing/services/account.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Timbres
        </h1>
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
