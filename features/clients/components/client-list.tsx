'use client'

import { Users } from 'lucide-react'
import { Card, CardContent } from '@shared/ui/card'
import { Button } from '@shared/ui/button'
import type { Client } from '../types/client.types'

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay clientes aún
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Agrega tu primer cliente para comenzar a facturar
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Nuevo Cliente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map(client => (
        <Card
          key={client.id}
          className="border-border hover:shadow-md transition-shadow group cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {client.razonSocial}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {client.rfc}
                </p>
                {client.email && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {client.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
