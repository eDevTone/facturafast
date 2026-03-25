/**
 * Seed: SAT Catalogs for CFDI 4.0
 * Fuente: http://www.sat.gob.mx/sitio_internet/cfd/catalogos/
 *
 * Ejecutar con: npx tsx database/seeds/sat-catalogs.seed.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import {
  cfdiUsageTypes,
  paymentForms,
  paymentMethods,
  taxRegimes,
  unitCodes,
  productServiceCodes,
} from '../schemas/sat-catalogs.schema'

dotenv.config({ path: '.env.local' })

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// ─── c_UsoCFDI ────────────────────────────────────────────────────────────────
const usoCfdiData = [
  { code: 'G01', description: 'Adquisición de mercancias', applicableToMoral: true, applicableToFisica: true },
  { code: 'G02', description: 'Devoluciones, descuentos o bonificaciones', applicableToMoral: true, applicableToFisica: true },
  { code: 'G03', description: 'Gastos en general', applicableToMoral: true, applicableToFisica: true },
  { code: 'I01', description: 'Construcciones', applicableToMoral: true, applicableToFisica: true },
  { code: 'I02', description: 'Mobilario y equipo de oficina por inversiones', applicableToMoral: true, applicableToFisica: true },
  { code: 'I03', description: 'Equipo de transporte', applicableToMoral: true, applicableToFisica: true },
  { code: 'I04', description: 'Equipo de computo y accesorios', applicableToMoral: true, applicableToFisica: true },
  { code: 'I05', description: 'Dados, troqueles, moldes, matrices y herramental', applicableToMoral: true, applicableToFisica: true },
  { code: 'I06', description: 'Comunicaciones telefónicas', applicableToMoral: true, applicableToFisica: true },
  { code: 'I07', description: 'Comunicaciones satelitales', applicableToMoral: true, applicableToFisica: true },
  { code: 'I08', description: 'Otra maquinaria y equipo', applicableToMoral: true, applicableToFisica: true },
  { code: 'D01', description: 'Honorarios médicos, dentales y gastos hospitalarios', applicableToMoral: false, applicableToFisica: true },
  { code: 'D02', description: 'Gastos médicos por incapacidad o discapacidad', applicableToMoral: false, applicableToFisica: true },
  { code: 'D03', description: 'Gastos funerales', applicableToMoral: false, applicableToFisica: true },
  { code: 'D04', description: 'Donativos', applicableToMoral: false, applicableToFisica: true },
  { code: 'D05', description: 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)', applicableToMoral: false, applicableToFisica: true },
  { code: 'D06', description: 'Aportaciones voluntarias al SAR', applicableToMoral: false, applicableToFisica: true },
  { code: 'D07', description: 'Primas por seguros de gastos médicos', applicableToMoral: false, applicableToFisica: true },
  { code: 'D08', description: 'Gastos de transportación escolar obligatoria', applicableToMoral: false, applicableToFisica: true },
  { code: 'D09', description: 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones', applicableToMoral: false, applicableToFisica: true },
  { code: 'D10', description: 'Pagos por servicios educativos (colegiaturas)', applicableToMoral: false, applicableToFisica: true },
  { code: 'S01', description: 'Sin efectos fiscales', applicableToMoral: true, applicableToFisica: true },
  { code: 'CP01', description: 'Pagos', applicableToMoral: true, applicableToFisica: true },
  { code: 'CN01', description: 'Nómina', applicableToMoral: false, applicableToFisica: true },
]

// ─── c_FormaPago ──────────────────────────────────────────────────────────────
const formaPagoData = [
  { code: '01', description: 'Efectivo' },
  { code: '02', description: 'Cheque nominativo' },
  { code: '03', description: 'Transferencia electrónica de fondos' },
  { code: '04', description: 'Tarjeta de crédito' },
  { code: '05', description: 'Monedero electrónico' },
  { code: '06', description: 'Dinero electrónico' },
  { code: '08', description: 'Vales de despensa' },
  { code: '12', description: 'Dación en pago' },
  { code: '13', description: 'Pago por subrogación' },
  { code: '14', description: 'Pago por consignación' },
  { code: '15', description: 'Condonación' },
  { code: '17', description: 'Compensación' },
  { code: '23', description: 'Novación' },
  { code: '24', description: 'Confusión' },
  { code: '25', description: 'Remisión de deuda' },
  { code: '26', description: 'Prescripción o caducidad' },
  { code: '27', description: 'A satisfacción del acreedor' },
  { code: '28', description: 'Tarjeta de débito' },
  { code: '29', description: 'Tarjeta de servicios' },
  { code: '30', description: 'Aplicación de anticipos' },
  { code: '31', description: 'Intermediario pagos' },
  { code: '99', description: 'Por definir' },
]

// ─── c_MetodoPago ─────────────────────────────────────────────────────────────
const metodoPagoData = [
  { code: 'PUE', description: 'Pago en una sola exhibición' },
  { code: 'PPD', description: 'Pago en parcialidades o diferido' },
]

// ─── c_RegimenFiscal ──────────────────────────────────────────────────────────
const regimenFiscalData = [
  { code: '601', description: 'General de Ley Personas Morales', applicableToMoral: true, applicableToFisica: false },
  { code: '603', description: 'Personas Morales con Fines no Lucrativos', applicableToMoral: true, applicableToFisica: false },
  { code: '605', description: 'Sueldos y Salarios e Ingresos Asimilados a Salarios', applicableToMoral: false, applicableToFisica: true },
  { code: '606', description: 'Arrendamiento', applicableToMoral: false, applicableToFisica: true },
  { code: '607', description: 'Régimen de Enajenación o Adquisición de Bienes', applicableToMoral: false, applicableToFisica: true },
  { code: '608', description: 'Demás ingresos', applicableToMoral: false, applicableToFisica: true },
  { code: '609', description: 'Consolidación', applicableToMoral: true, applicableToFisica: false },
  { code: '610', description: 'Residentes en el Extranjero sin Establecimiento Permanente en México', applicableToMoral: true, applicableToFisica: true },
  { code: '611', description: 'Ingresos por Dividendos (socios y accionistas)', applicableToMoral: false, applicableToFisica: true },
  { code: '612', description: 'Personas Físicas con Actividades Empresariales y Profesionales', applicableToMoral: false, applicableToFisica: true },
  { code: '614', description: 'Ingresos por intereses', applicableToMoral: false, applicableToFisica: true },
  { code: '615', description: 'Régimen de los ingresos por obtención de premios', applicableToMoral: false, applicableToFisica: true },
  { code: '616', description: 'Sin obligaciones fiscales', applicableToMoral: false, applicableToFisica: true },
  { code: '620', description: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', applicableToMoral: true, applicableToFisica: false },
  { code: '621', description: 'Incorporación Fiscal', applicableToMoral: false, applicableToFisica: true },
  { code: '622', description: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', applicableToMoral: true, applicableToFisica: true },
  { code: '623', description: 'Opcional para Grupos de Sociedades', applicableToMoral: true, applicableToFisica: false },
  { code: '624', description: 'Coordinados', applicableToMoral: true, applicableToFisica: false },
  { code: '625', description: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', applicableToMoral: false, applicableToFisica: true },
  { code: '626', description: 'Régimen Simplificado de Confianza', applicableToMoral: true, applicableToFisica: true },
]

// ─── c_ClaveUnidad ────────────────────────────────────────────────────────────
const claveUnidadData = [
  { code: 'H87', name: 'Pieza', description: 'Unidad de conteo para artículos individuales' },
  { code: 'E48', name: 'Unidad de servicio', description: 'Para servicios en general' },
  { code: 'ACT', name: 'Actividad', description: 'Para servicios profesionales por actividad' },
  { code: 'KGM', name: 'Kilogramo', description: null },
  { code: 'GRM', name: 'Gramo', description: null },
  { code: 'LTR', name: 'Litro', description: null },
  { code: 'MTR', name: 'Metro', description: null },
  { code: 'MTK', name: 'Metro cuadrado', description: null },
  { code: 'MTQ', name: 'Metro cúbico', description: null },
  { code: 'KMT', name: 'Kilómetro', description: null },
  { code: 'HUR', name: 'Hora', description: null },
  { code: 'DAY', name: 'Día', description: null },
  { code: 'MON', name: 'Mes', description: null },
  { code: 'ANN', name: 'Año', description: null },
  { code: 'SET', name: 'Conjunto', description: null },
  { code: 'KIT', name: 'Kit', description: null },
  { code: 'XBX', name: 'Caja', description: null },
  { code: 'XPK', name: 'Paquete', description: null },
  { code: 'XBG', name: 'Bolsa', description: null },
  { code: 'PR', name: 'Par', description: null },
  { code: 'DZN', name: 'Docena', description: null },
  { code: 'GLL', name: 'Galón', description: null },
  { code: 'TON', name: 'Tonelada', description: null },
  { code: 'MLT', name: 'Mililitro', description: null },
  { code: 'CMT', name: 'Centímetro', description: null },
]

// ─── c_ClaveProdServ (más usados para servicios tech/freelance) ───────────────
const claveProdServData = [
  // Servicios de tecnología (los más comunes para freelancers tech)
  { code: '81112100', description: 'Servicios de consultoría en tecnologías de la información', category: 'Tecnología' },
  { code: '81112101', description: 'Servicios de análisis y programación de sistemas', category: 'Tecnología' },
  { code: '81112102', description: 'Servicios de diseño de sistemas de cómputo', category: 'Tecnología' },
  { code: '81112103', description: 'Servicios de programación de sistemas de cómputo', category: 'Tecnología' },
  { code: '81112104', description: 'Servicios de administración de sistemas de cómputo', category: 'Tecnología' },
  { code: '81112105', description: 'Servicios de mantenimiento de sistemas de cómputo', category: 'Tecnología' },
  { code: '81112106', description: 'Servicios de soporte técnico de tecnologías de la información', category: 'Tecnología' },
  { code: '81112107', description: 'Servicios de recuperación de datos', category: 'Tecnología' },
  { code: '81111500', description: 'Servicios de tecnologías de la información (TI)', category: 'Tecnología' },
  { code: '43231500', description: 'Software empresarial', category: 'Tecnología' },
  { code: '43231513', description: 'Software de aplicación', category: 'Tecnología' },
  { code: '81111600', description: 'Servicios de internet', category: 'Tecnología' },
  // Diseño y web
  { code: '81111700', description: 'Servicios de diseño web', category: 'Diseño' },
  { code: '81111701', description: 'Servicios de diseño gráfico', category: 'Diseño' },
  { code: '81111900', description: 'Servicios de publicidad', category: 'Marketing' },
  // Servicios profesionales generales
  { code: '84111506', description: 'Servicios de facturación', category: 'Servicios Profesionales' },
  { code: '84111507', description: 'Servicios de contabilidad', category: 'Servicios Profesionales' },
  { code: '84111508', description: 'Servicios de auditoría', category: 'Servicios Profesionales' },
  { code: '80141600', description: 'Servicios de consultoría empresarial', category: 'Consultoría' },
  { code: '80141601', description: 'Servicios de asesoría empresarial', category: 'Consultoría' },
  // Capacitación
  { code: '86111800', description: 'Servicios de capacitación', category: 'Educación' },
  { code: '86111801', description: 'Servicios de enseñanza técnica y vocacional', category: 'Educación' },
  // Comercio general
  { code: '01010101', description: 'No existe en el catálogo', category: 'General' },
]

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Iniciando seed de catálogos SAT...\n')

  try {
    console.log('📋 Inserting cfdi_usage_types...')
    await db.insert(cfdiUsageTypes).values(usoCfdiData).onConflictDoNothing()
    console.log(`   ✅ ${usoCfdiData.length} records`)

    console.log('💳 Inserting payment_forms...')
    await db.insert(paymentForms).values(formaPagoData).onConflictDoNothing()
    console.log(`   ✅ ${formaPagoData.length} records`)

    console.log('💰 Inserting payment_methods...')
    await db.insert(paymentMethods).values(metodoPagoData).onConflictDoNothing()
    console.log(`   ✅ ${metodoPagoData.length} records`)

    console.log('🏢 Inserting tax_regimes...')
    await db.insert(taxRegimes).values(regimenFiscalData).onConflictDoNothing()
    console.log(`   ✅ ${regimenFiscalData.length} records`)

    console.log('📦 Inserting unit_codes...')
    await db.insert(unitCodes).values(claveUnidadData).onConflictDoNothing()
    console.log(`   ✅ ${claveUnidadData.length} records`)

    console.log('🛒 Inserting product_service_codes...')
    await db.insert(productServiceCodes).values(claveProdServData).onConflictDoNothing()
    console.log(`   ✅ ${claveProdServData.length} records`)

    console.log('\n✅ Seed completado exitosamente!')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed()
