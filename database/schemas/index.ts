export * from './clients.schema'
export * from './invoices.schema'
export * from './issuing-profiles.schema'
export * from './sat-catalogs.schema'
export * from './subscriptions.schema'
export * from './stamp-purchases.schema'

// Re-export for relations
import * as clients from './clients.schema'
import * as invoices from './invoices.schema'
import * as issuingProfiles from './issuing-profiles.schema'
import * as satCatalogs from './sat-catalogs.schema'
import * as accounts from './subscriptions.schema'
import * as stampPurchases from './stamp-purchases.schema'

export const schema = {
  ...clients,
  ...invoices,
  ...issuingProfiles,
  ...satCatalogs,
  ...accounts,
  ...stampPurchases,
}
