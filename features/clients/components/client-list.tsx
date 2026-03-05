'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, Search, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { EditClientDialog } from './edit-client-dialog'
import { DeleteClientDialog } from './delete-client-dialog'
import type { Client } from '../types/client.types'

const TAX_REGIME_LABELS: Record<string, string> = {
  '601': 'General Ley PM',
  '603': 'Fines no Lucrativos',
  '605': 'Sueldos y Salarios',
  '606': 'Arrendamiento',
  '608': 'Demás ingresos',
  '610': 'Residentes Extranjero',
  '611': 'Dividendos',
  '612': 'Act. Empresariales PF',
  '614': 'Intereses',
  '615': 'Premios',
  '616': 'Sin obligaciones',
  '621': 'Incorporación Fiscal',
  '625': 'Plataformas Tec.',
  '626': 'RESICO',
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      c =>
        c.businessName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No hay clientes aún
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Agrega tu primer cliente para comenzar a facturar. Puedes subir su CSF para autocompletar los datos.
          </p>
          <Link href="/clients/new" className="mt-5">
            <Button>Nuevo Cliente</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar por nombre, RFC o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
        {/* Column header */}
        <div className="hidden md:grid md:grid-cols-[1fr_140px_160px_180px_80px] items-center gap-4 px-5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Cliente
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            RFC
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Régimen
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Contacto
          </span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron clientes para "{search}"
            </p>
          </div>
        ) : (
          filtered.map(client => (
            <div
              key={client.id}
              className="group grid grid-cols-1 md:grid-cols-[1fr_140px_160px_180px_80px] items-center gap-2 md:gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
            >
              {/* Name + Email */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {client.businessName}
                </p>
                {client.email && (
                  <span className="flex items-center gap-1.5 mt-0.5 text-[12px] text-muted-foreground truncate md:hidden">
                    <Mail className="h-3 w-3 shrink-0" />
                    {client.email}
                  </span>
                )}
              </div>

              {/* RFC */}
              <p className="text-[13px] font-mono tracking-wide text-muted-foreground">
                {client.rfc}
              </p>

              {/* Régimen */}
              <div>
                {client.taxRegime ? (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {TAX_REGIME_LABELS[client.taxRegime] || client.taxRegime}
                  </span>
                ) : (
                  <span className="text-[12px] text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Contact */}
              <div className="hidden md:flex items-center gap-3 text-[12px] text-muted-foreground">
                {client.email && (
                  <span className="flex items-center gap-1 truncate" title={client.email}>
                    <Mail className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    <span className="truncate">{client.email}</span>
                  </span>
                )}
                {!client.email && client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    {client.phone}
                  </span>
                )}
                {!client.email && !client.phone && client.postalCode && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    CP {client.postalCode}
                  </span>
                )}
                {!client.email && !client.phone && !client.postalCode && (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5">
                <EditClientDialog client={client} />
                <DeleteClientDialog
                  clientId={client.id}
                  clientName={client.businessName}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
