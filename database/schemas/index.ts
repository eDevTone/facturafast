export * from './fiscal-profile'
export * from './clients'
export * from './invoices'

// Re-export for relations
import * as fiscalProfile from './fiscal-profile'
import * as clients from './clients'
import * as invoices from './invoices'

export const schema = {
  ...fiscalProfile,
  ...clients,
  ...invoices
}
