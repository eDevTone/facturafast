'use client'

import { FileText } from 'lucide-react'
import { Badge } from '@shared/ui/badge'
import { Card, CardContent } from '@shared/ui/card'
import { Button } from '@shared/ui/button'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'

interface InvoiceListProps {
  invoices: InvoiceWithRelations[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay facturas aún
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crea tu primera factura para comenzar
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Nueva Factura
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <Card
          key={invoice.id}
          className="border-border hover:shadow-md transition-shadow group cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Invoice info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {invoice.serie && `${invoice.serie}-`}{invoice.folio}
                    </p>
                    <StatusBadge status={invoice.estatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.razonSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invoice.fechaEmision).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Right: Amount + Actions */}
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(parseFloat(invoice.total))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {invoice.items.length} concepto{invoice.items.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    draft: 'bg-muted text-muted-foreground border-border',
    timbrada: 'bg-success/10 text-success border-success/20',
    cancelada: 'bg-destructive/10 text-destructive border-destructive/20'
  }

  const labels = {
    draft: 'Borrador',
    timbrada: 'Timbrada',
    cancelada: 'Cancelada'
  }

  return (
    <Badge className={variants[status as keyof typeof variants]}>
      {labels[status as keyof typeof labels]}
    </Badge>
  )
}
