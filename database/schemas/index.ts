export * from './clients.schema'
export * from './invoices.schema'
export * from './issuing-profiles.schema'
export * from './sat-catalogs.schema'

// Re-export for relations
import * as clients from './clients.schema'
import * as invoices from './invoices.schema'
import * as issuingProfiles from './issuing-profiles.schema'
import * as satCatalogs from './sat-catalogs.schema'


export const schema = {
  ...clients,
  ...invoices,
  ...issuingProfiles,
  ...satCatalogs,
}
