'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { SectionLabel } from '@shared/components/section-label'
import { STAMP_PACKAGES } from '../constants/plans'
import type { StampPackageId } from '../constants/plans'
import type { PurchaseRecord } from '../types/billing.types'
import { PackageCard } from './package-card'
import { PurchaseHistory } from './purchase-history'
import { createCheckoutAction } from '../actions/create-checkout.action'

interface BillingPageProps {
  stampsBalance: number
  purchaseHistory: PurchaseRecord[]
  paymentSuccess?: boolean
  paymentError?: boolean
}

export function BillingPage({ stampsBalance, purchaseHistory, paymentSuccess, paymentError }: BillingPageProps) {
  const [loadingPackage, setLoadingPackage] = useState<StampPackageId | null>(null)
  const [, startTransition] = useTransition()

  const handleSelectPackage = (packageId: StampPackageId) => {
    setLoadingPackage(packageId)
    startTransition(async () => {
      try {
        await createCheckoutAction(packageId)
      } catch (error) {
        // redirect() throws a NEXT_REDIRECT error — that's expected
        const isRedirect = error instanceof Error && error.message.includes('NEXT_REDIRECT')
        if (!isRedirect) {
          toast.error('No se pudo abrir el pago', { description: 'Revisa tu conexión e inténtalo de nuevo.' })
          setLoadingPackage(null)
        }
      }
    })
  }

  const isDepleted = stampsBalance <= 0
  const isLow = !isDepleted && stampsBalance <= 1

  return (
    <div className="space-y-10">
      {paymentSuccess && (
        <p role="status" className="hoja border-l-2 border-sello px-4 py-3 text-sm text-tinta">
          Recibimos tu pago. Los timbres aparecen en tu saldo en cuanto el banco lo confirme; con OXXO o SPEI puede
          tardar unas horas.
        </p>
      )}

      {paymentError && (
        <p role="alert" className="hoja border-l-2 border-tinta-roja px-4 py-3 text-sm text-tinta">
          El pago no se completó y no se te cobró. Inténtalo de nuevo o paga con otro método (tarjeta, OXXO o SPEI).
        </p>
      )}

      {/* Balance: a postage-style timbre */}
      <section className="flex flex-wrap items-center gap-6">
        <div className="timbre w-44 rounded-[2px]">
          <div className="timbre-cara px-4 py-5 text-center">
            <p
              className={cn(
                'font-mono text-5xl font-medium leading-none',
                isDepleted ? 'text-tinta-roja' : isLow ? 'text-ocre' : 'text-tinta',
              )}
            >
              {stampsBalance}
            </p>
            <p className="mt-2 text-[12px] text-tinta-tenue">
              {stampsBalance === 1 ? 'timbre disponible' : 'timbres disponibles'}
            </p>
          </div>
        </div>
        <div className="max-w-sm space-y-1 text-sm text-tinta-tenue">
          <p>Cada factura timbrada usa un timbre. Los borradores no gastan timbres.</p>
          {isDepleted ? (
            <p className="font-medium text-tinta-roja">Te quedaste sin timbres: compra un paquete para seguir timbrando.</p>
          ) : isLow ? (
            <p className="font-medium text-ocre">Te queda un timbre. Recarga antes de tu próxima factura.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel rule={false}>Pliegos de timbres</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAMP_PACKAGES.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              note={index === 0 ? 'Para empezar' : undefined}
              onSelect={handleSelectPackage}
              isLoading={loadingPackage === pkg.id}
              disabled={loadingPackage !== null && loadingPackage !== pkg.id}
            />
          ))}
        </div>
        <p className="text-[13px] text-tinta-tenue">
          Precios en MXN. Los timbres no vencen y se suman a tu saldo. Paga con tarjeta, OXXO o SPEI.
        </p>
      </section>

      <PurchaseHistory purchases={purchaseHistory} />
    </div>
  )
}
