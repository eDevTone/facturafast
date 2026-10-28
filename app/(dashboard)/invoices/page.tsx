import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { AccountantDialog } from '@features/accountant/components/accountant-dialog'
import { InvoiceList } from '@features/invoicing/components/invoice-list'
import { getInvoices } from '@features/invoicing/services/invoice.service'
import { getPaidAmountsByInvoice } from '@features/payments/services/payment.service'
import { countRecurringInvoices } from '@features/recurring/services/recurring.service'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { Button } from '@shared/ui/button'
import { CalendarSync, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { userId } = await auth()
  const { estado } = await searchParams

  if (!userId) {
    notFound()
  }

  const [invoices, paidByInvoice, recurringCount] = await Promise.all([
    getInvoices(userId),
    getPaidAmountsByInvoice(userId),
    countRecurringInvoices(userId),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight">
          Facturas
          {invoices.length > 0 && (
            <span className="ml-2.5 font-mono text-sm font-normal text-tinta-tenue">{invoices.length}</span>
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {invoices.some((invoice) => invoice.status !== 'draft') && <AccountantDialog />}
          {recurringCount > 0 && (
            <Button asChild variant="outline">
              <Link href="/invoices/recurring">
                <CalendarSync />
                Cada mes
                <span className="font-mono text-[12px] text-tinta-tenue">{recurringCount}</span>
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/invoices/new">
              <Plus />
              Nueva factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        paidByInvoice={paidByInvoice}
        today={todayInMexico()}
        initialFilter={estado === 'por-cobrar' ? 'por_cobrar' : estado === 'vencidas' ? 'vencidas' : undefined}
      />
    </div>
  )
}
