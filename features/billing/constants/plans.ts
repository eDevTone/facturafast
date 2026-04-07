export const STAMP_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    stamps: 20,
    price: 99,
    conektaProductId: process.env.CONEKTA_PRODUCT_STARTER || 'ff-stamps-starter',
    features: [
      '20 timbres CFDI',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte por email',
    ],
  },
  {
    id: 'basico',
    name: 'Básico',
    stamps: 50,
    price: 199,
    conektaProductId: process.env.CONEKTA_PRODUCT_BASICO || 'ff-stamps-basico',
    features: [
      '50 timbres CFDI',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    stamps: 150,
    price: 499,
    recommended: true,
    conektaProductId: process.env.CONEKTA_PRODUCT_PRO || 'ff-stamps-pro',
    features: [
      '150 timbres CFDI',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte prioritario',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    stamps: 300,
    price: 899,
    conektaProductId: process.env.CONEKTA_PRODUCT_BUSINESS || 'ff-stamps-business',
    features: [
      '300 timbres CFDI',
      'Clientes ilimitados',
      'Descarga XML + PDF',
      'Soporte dedicado',
    ],
  },
] as const

export type StampPackageId = (typeof STAMP_PACKAGES)[number]['id']
