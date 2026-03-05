export * from './fiscal-profile'
export * from './clients.schema'
export * from './invoices.schema'

// Re-export for relations
import * as fiscalProfile from './fiscal-profile'
import * as clients from './clients.schema'
import * as invoices from './invoices.schema'

export const schema = {
  ...fiscalProfile,
  ...clients,
  ...invoices
}
