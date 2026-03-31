'use client'

import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Mail, MapPin, Phone, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePagination } from '@shared/hooks/use-pagination'
import { TablePagination } from '@shared/components/table-pagination'
import type { Client } from '../types/client.types'
import { DeleteClientDialog } from './delete-client-dialog'
import { EditClientDialog } from './edit-client-dialog'

interface ClientListProps {
  clients: Client[]
  taxRegimeLabels: Record<string, string>
  catalogs: {
    taxRegimes: CatalogOption[]
    cfdiUsages: CatalogOption[]
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const PAGE_SIZE = 10

export function ClientList({ clients, taxRegimeLabels, catalogs }: ClientListProps) {
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

  const pagination = usePagination(filtered, PAGE_SIZE)

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No hay clientes aun
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
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="divide-y divide-border/40">
        {/* Column header */}
        <div className="hidden md:grid md:grid-cols-[1fr_130px_180px_170px_72px] items-center gap-3 px-5 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Cliente
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            RFC
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Regimen
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Contacto
          </span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron clientes para &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          pagination.items.map(client => (
            <div
              key={client.id}
              className="group grid grid-cols-1 md:grid-cols-[1fr_130px_180px_170px_72px] items-center gap-2 md:gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Name with avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-[11px] font-semibold text-muted-foreground/60">
                  {getInitials(client.businessName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {client.businessName}
                  </p>
                  <p className="text-[11px] text-muted-foreground/40 mt-0.5 md:hidden">
                    {client.rfc}
                  </p>
                </div>
              </div>

              {/* RFC */}
              <p className="hidden md:block text-[12px] font-mono tracking-wide text-muted-foreground/60">
                {client.rfc}
              </p>

              {/* Regimen */}
              <div className="hidden md:block">
                {client.taxRegime ? (
                  <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 truncate max-w-full">
                    {taxRegimeLabels[client.taxRegime] || client.taxRegime}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/30">—</span>
                )}
              </div>

              {/* Contact */}
              <div className="hidden md:block">
                {client.email ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 truncate" title={client.email}>
                    <Mail className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    <span className="truncate">{client.email}</span>
                  </span>
                ) : client.phone ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    {client.phone}
                  </span>
                ) : client.postalCode ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    CP {client.postalCode}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/30">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5">
                <EditClientDialog client={client} catalogs={catalogs} />
                <DeleteClientDialog
                  clientId={client.id}
                  clientName={client.businessName}
                />
              </div>
            </div>
          ))
        )}
        </div>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
