import type { PlanDefinition } from '../types/billing.types'

export const PLAN_LIMITS = {
  free: { stamps: 5 },
  starter: { stamps: 30 },
  pro: { stamps: 100 },
  business: { stamps: Infinity },
} as const

export const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    regularPrice: 149,
    stamps: 30,
    conektaPlanId: process.env.CONEKTA_PLAN_STARTER || 'facturafast-starter',
    features: [
      '30 timbres CFDI/mes',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 179,
    regularPrice: 349,
    stamps: 100,
    recommended: true,
    conektaPlanId: process.env.CONEKTA_PLAN_PRO || 'facturafast-pro',
    features: [
      '100 timbres CFDI/mes',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte prioritario',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 449,
    regularPrice: 899,
    stamps: Infinity,
    conektaPlanId: process.env.CONEKTA_PLAN_BUSINESS || 'facturafast-business',
    features: [
      'Timbres ilimitados',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte dedicado',
    ],
  },
]
