'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, PLAN_LIMITS } from '../constants/plans'
import type { PlanId } from '../types/billing.types'
import { PlanCard } from './plan-card'
import { createCheckoutAction } from '../actions/create-checkout.action'
import { cancelSubscriptionAction } from '../actions/cancel-subscription.action'

interface BillingPageProps {
  currentPlan: PlanId
  status: 'active' | 'past_due' | 'cancelled'
  stampsUsed: number
  periodEnd: string | null
  paymentSuccess?: boolean
  paymentError?: boolean
}

export function BillingPage({ currentPlan, status, stampsUsed, periodEnd, paymentSuccess, paymentError }: BillingPageProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [, startTransition] = useTransition()
  const limit = PLAN_LIMITS[currentPlan].stamps
  const isUnlimited = limit === Infinity
  const percentage = isUnlimited ? 0 : Math.min((stampsUsed / limit) * 100, 100)

  const renewalLabel = periodEnd

  const handleSelectPlan = (planId: PlanId) => {
    setLoadingPlan(planId)
    startTransition(async () => {
      try {
        await createCheckoutAction(planId)
      } catch (error) {
        // redirect() throws a NEXT_REDIRECT error — that's expected
        const isRedirect = error instanceof Error && error.message.includes('NEXT_REDIRECT')
        if (!isRedirect) {
          toast.error('Error al iniciar el pago')
          setLoadingPlan(null)
        }
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Payment success */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Pago procesado correctamente. Tu plan se actualizará en unos momentos.
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

      {/* Past due warning */}
      {status === 'past_due' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-foreground">
            Tu último pago falló. Actualiza tu método de pago para mantener tu plan.
          </p>
        </div>
      )}

      {/* Current plan summary */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Tu plan
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground capitalize">
              {currentPlan}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Zap className="h-3.5 w-3.5 text-muted-foreground/60" />
              {isUnlimited ? (
                <span className="text-sm font-medium text-foreground">Timbres ilimitados</span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {stampsUsed} <span className="text-muted-foreground/50">/ {limit} timbres</span>
                </span>
              )}
            </div>
            {renewalLabel && (
              <p className="mt-0.5 text-[12px] text-muted-foreground/40">
                Se renueva el {renewalLabel}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="mt-3 h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 100
                  ? 'bg-destructive'
                  : percentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
          Planes disponibles
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              onSelect={handleSelectPlan}
              isLoading={loadingPlan === plan.id}
            />
          ))}
        </div>
      </div>

      {/* Early adopter note */}
      <p className="text-center text-[12px] text-muted-foreground/40">
        Precio de lanzamiento — los primeros 100 usuarios lo mantienen para siempre.
      </p>

      {/* Cancel link */}
      {currentPlan !== 'free' && (
        <div className="text-center">
          <button
            type="button"
            className="text-[12px] text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
            onClick={async () => {
              if (!confirm('¿Seguro que quieres cancelar tu suscripción? Volverás al plan Free.')) return
              const result = await cancelSubscriptionAction()
              if (result.success) {
                toast.success('Suscripción cancelada. Ahora estás en el plan Free.')
              } else {
                toast.error(result.error || 'Error al cancelar')
              }
            }}
          >
            Cancelar suscripción
          </button>
        </div>
      )}
    </div>
  )
}
