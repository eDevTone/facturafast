'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
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
          toast.error('Error al iniciar el pago')
          setLoadingPackage(null)
        }
      }
    })
  }

  const isLowBalance = stampsBalance < 10

  return (
    <div className="space-y-8">
      {/* Payment success */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Pago procesado correctamente. Tus timbres se añadirán en unos momentos.
          </p>
        </div>
      )}

      {/* Payment error */}
      {paymentError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.05] px-4 py-3">
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            El pago no pudo completarse. Intenta de nuevo o usa otro método de pago.
          </p>
        </div>
      )}

      {/* Balance prominente */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Tu saldo
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
            {stampsBalance}
          </span>
          <span className="text-sm text-muted-foreground">timbres disponibles</span>
        </div>
        {isLowBalance && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-amber-500">
            <Zap className="h-3.5 w-3.5" />
            Te quedan pocos timbres — elige un paquete para recargar
          </p>
        )}
      </div>

      {/* Package cards */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
          Paquetes de timbres
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAMP_PACKAGES.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSelect={handleSelectPackage}
              isLoading={loadingPackage === pkg.id}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] text-muted-foreground/40">
          Los timbres no vencen y se acumulan con cada compra.
        </p>
      </div>

      {/* Purchase history */}
      <PurchaseHistory purchases={purchaseHistory} />
    </div>
  )
}
