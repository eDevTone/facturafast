import { auth } from '@clerk/nextjs/server'
import { RecurringList } from '@features/recurring/components/recurring-list'
import { getRecurringInvoices } from '@features/recurring/services/recurring.service'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RecurringInvoicesPage() {
  const { userId } = await auth()
  if (!userId) notFound()

  const items = await getRecurringInvoices(userId)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Facturas
        </Link>
        <h1 className="mt-4 text-[22px] font-semibold tracking-tight">Facturas de cada mes</h1>
        <p className="mt-1 text-sm text-tinta-tenue">
          El día que elegiste, por la mañana, hacemos la factura del mes y te avisamos por correo.
        </p>
      </div>

      <RecurringList items={items} today={todayInMexico()} />
    </div>
  )
}
