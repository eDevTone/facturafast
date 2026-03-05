'use client'

import Link from 'next/link'
import { Users, Phone, MapPin } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Badge } from '@shared/ui/badge'
import type { Client } from '../types/client.types'

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No hay clientes aún
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega tu primer cliente para comenzar a facturar
          </p>
          <Link href="/clients/new" className="mt-5">
            <Button>Nuevo Cliente</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {clients.map(client => (
        <div
          key={client.id}
          className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">
                {client.businessName}
              </h3>
              <p className="mt-0.5 text-sm font-mono text-muted-foreground">
                {client.rfc}
              </p>
            </div>
            {client.taxRegime && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {client.taxRegime}
              </Badge>
            )}
          </div>

          {client.email && (
            <p className="mt-3 text-xs text-muted-foreground truncate">
              {client.email}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
            {client.phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {client.phone}
              </span>
            )}
            {client.postalCode && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {client.postalCode}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
