import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Issuing Profiles — múltiples perfiles emisores (RFC) por usuario.
 * El usuario puede tener varios RFC y elegir con cuál facturar en cada CFDI.
 */
export const issuingProfiles = pgTable('issuing_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID

  rfc: varchar('rfc', { length: 13 }).notNull(),
  businessName: text('business_name').notNull(),
  taxRegime: varchar('tax_regime', { length: 10 }).notNull(),
  postalCode: varchar('postal_code', { length: 5 }).notNull(),
  email: text('email').notNull(),
  phone: varchar('phone', { length: 20 }),

  /** Este es el perfil que se usa por defecto si el usuario no elige otro */
  isDefault: boolean('is_default').notNull().default(false),

  /** Logo de la empresa (key de R2) */
  logoUrl: text('logo_url'),

  // Datos para que le paguen: salen en el PDF, el correo de la factura y los recordatorios
  bankName: varchar('bank_name', { length: 60 }),
  /** CLABE interbancaria (18 dígitos, con dígito verificador). */
  clabe: varchar('clabe', { length: 18 }),
  /** Link de pago (https), por ejemplo de Mercado Pago o Clip. */
  paymentLink: text('payment_link'),
  /** Email the client when an invoice falls due, and a week later ("Recordar automáticamente"). */
  autoReminders: boolean('auto_reminders').notNull().default(false),

  // CSD — Certificado de Sello Digital (requerido para timbrado real)
  cerFilename: text('cer_filename'),
  cerBase64: text('cer_base64'),     // .cer en base64
  keyFilename: text('key_filename'),
  keyBase64: text('key_base64'),     // .key en base64
  keyPassword: text('key_password'), // ⚠️ TODO: cifrar en producción

  // Metadata extraída del .cer
  certSerialNumber: text('cert_serial_number'),
  certValidFrom: text('cert_valid_from'),   // ISO date
  certValidUntil: text('cert_valid_until'), // ISO date

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type IssuingProfile = typeof issuingProfiles.$inferSelect
export type NewIssuingProfile = typeof issuingProfiles.$inferInsert
