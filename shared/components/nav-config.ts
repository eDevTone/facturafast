import { Briefcase, Building2, FileText, Home, Ticket, Users, type LucideIcon } from 'lucide-react'

export interface NavEntry {
  href: string
  label: string
  icon: LucideIcon
}

/** One navigation for desktop and mobile, in the order a freelancer uses it. */
export const NAV_ENTRIES: NavEntry[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/invoices', label: 'Facturas', icon: FileText },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/catalog', label: 'Mis servicios', icon: Briefcase },
  { href: '/billing', label: 'Timbres', icon: Ticket },
  { href: '/fiscal-profiles', label: 'Mis datos fiscales', icon: Building2 },
]
