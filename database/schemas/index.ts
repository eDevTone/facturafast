export * from './clients.schema'
export * from './invoices.schema'
export * from './issuing-profiles.schema'
export * from './sat-catalogs.schema'
export * from './subscriptions.schema'
export * from './stamp-purchases.schema'
export * from './payments.schema'
export * from './catalog.schema'
export * from './exchange-rates.schema'
export * from './payment-reminders.schema'
export * from './recurring-invoices.schema'
export * from './accountant-links.schema'
export * from './client-data-requests.schema'

// Re-export for relations
import * as clients from './clients.schema'
import * as invoices from './invoices.schema'
import * as issuingProfiles from './issuing-profiles.schema'
import * as satCatalogs from './sat-catalogs.schema'
import * as accounts from './subscriptions.schema'
import * as stampPurchases from './stamp-purchases.schema'
import * as payments from './payments.schema'
import * as catalog from './catalog.schema'
import * as exchangeRates from './exchange-rates.schema'
import * as paymentReminders from './payment-reminders.schema'
import * as recurringInvoices from './recurring-invoices.schema'
import * as accountantLinks from './accountant-links.schema'
import * as clientDataRequests from './client-data-requests.schema'

export const schema = {
  ...clients,
  ...invoices,
  ...issuingProfiles,
  ...satCatalogs,
  ...accounts,
  ...stampPurchases,
  ...payments,
  ...catalog,
  ...exchangeRates,
  ...paymentReminders,
  ...recurringInvoices,
  ...accountantLinks,
  ...clientDataRequests,
}
