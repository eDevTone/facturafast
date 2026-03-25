import { pgTable, varchar, text, boolean } from 'drizzle-orm/pg-core'

// c_UsoCFDI - CFDI usage types
export const cfdiUsageTypes = pgTable('cfdi_usage_types', {
  code: varchar('code', { length: 10 }).primaryKey(),
  description: text('description').notNull(),
  applicableToMoral: boolean('applicable_to_moral').notNull().default(true),
  applicableToFisica: boolean('applicable_to_fisica').notNull().default(true),
})

// c_FormaPago - Payment forms
export const paymentForms = pgTable('payment_forms', {
  code: varchar('code', { length: 2 }).primaryKey(),
  description: text('description').notNull(),
})

// c_MetodoPago - Payment methods
export const paymentMethods = pgTable('payment_methods', {
  code: varchar('code', { length: 3 }).primaryKey(),
  description: text('description').notNull(),
})

// c_RegimenFiscal - Tax regimes
export const taxRegimes = pgTable('tax_regimes', {
  code: varchar('code', { length: 3 }).primaryKey(),
  description: text('description').notNull(),
  applicableToMoral: boolean('applicable_to_moral').notNull().default(false),
  applicableToFisica: boolean('applicable_to_fisica').notNull().default(false),
})

// c_ClaveUnidad - Unit codes
export const unitCodes = pgTable('unit_codes', {
  code: varchar('code', { length: 10 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
})

// c_ClaveProdServ - Product and service codes
export const productServiceCodes = pgTable('product_service_codes', {
  code: varchar('code', { length: 8 }).primaryKey(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
})
