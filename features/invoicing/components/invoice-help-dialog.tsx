'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { LucideIcon } from 'lucide-react'
import { Ban, Copy, Download, Eye, HelpCircle, Pencil, Send, Trash2 } from 'lucide-react'

interface HelpAction {
  icon: LucideIcon
  label: string
  description: string
  color: string
}

const DRAFT_ACTIONS: HelpAction[] = [
  {
    icon: Eye,
    label: 'Vista Previa',
    description: 'Genera un PDF para revisar tu factura antes de timbrar. Puedes descargarla como borrador.',
    color: 'text-muted-foreground',
  },
  {
    icon: Pencil,
    label: 'Editar',
    description: 'Modifica los datos de la factura: cliente, conceptos, forma de pago.',
    color: 'text-muted-foreground',
  },
  {
    icon: Send,
    label: 'Timbrar',
    description: 'Envía la factura al SAT para obtener el sello fiscal (UUID). Una vez timbrada no se puede editar, solo cancelar.',
    color: 'text-primary',
  },
  {
    icon: Trash2,
    label: 'Eliminar',
    description: 'Borra el borrador permanentemente. Solo funciona con facturas no timbradas.',
    color: 'text-destructive',
  },
]

const TIMBRADA_ACTIONS: HelpAction[] = [
  {
    icon: Download,
    label: 'Descargar XML',
    description: 'El archivo CFDI con validez fiscal. Es el comprobante oficial ante el SAT.',
    color: 'text-muted-foreground',
  },
  {
    icon: Download,
    label: 'Descargar PDF',
    description: 'Representación impresa de la factura con sello digital, QR y cadena original.',
    color: 'text-muted-foreground',
  },
  {
    icon: Eye,
    label: 'Vista Previa',
    description: 'Visualiza el PDF de la factura timbrada directamente en el navegador.',
    color: 'text-muted-foreground',
  },
  {
    icon: Copy,
    label: 'Copiar UUID',
    description: 'Copia el folio fiscal (UUID) al portapapeles. Útil para referencias con clientes o el SAT.',
    color: 'text-muted-foreground',
  },
  {
    icon: Ban,
    label: 'Cancelar',
    description: 'Solicita la cancelación ante el SAT. Requiere seleccionar un motivo. Esta acción es irreversible.',
    color: 'text-destructive',
  },
]

const CANCELADA_ACTIONS: HelpAction[] = [
  {
    icon: Download,
    label: 'Descargar XML',
    description: 'El archivo CFDI original. Aunque la factura fue cancelada, el XML se conserva para tu contabilidad.',
    color: 'text-muted-foreground',
  },
  {
    icon: Download,
    label: 'Descargar PDF',
    description: 'Representación impresa de la factura original.',
    color: 'text-muted-foreground',
  },
  {
    icon: Download,
    label: 'Acuse de cancelación',
    description: 'Comprobante oficial del SAT de que la cancelación fue aceptada. Consérvalo para auditorías y registros contables.',
    color: 'text-destructive',
  },
  {
    icon: Copy,
    label: 'Copiar UUID',
    description: 'Copia el folio fiscal (UUID) de la factura cancelada.',
    color: 'text-muted-foreground',
  },
]

const ACTIONS_BY_STATUS: Record<string, HelpAction[]> = {
  draft: DRAFT_ACTIONS,
  timbrada: TIMBRADA_ACTIONS,
  cancelada: CANCELADA_ACTIONS,
}

const FOOTER_BY_STATUS: Record<string, string | null> = {
  draft: 'El timbrado es irreversible y consume un timbre de tu plan.',
  timbrada: 'La cancelación se reporta al SAT y es irreversible.',
  cancelada: null,
}

interface InvoiceHelpDialogProps {
  status: string
}

export function InvoiceHelpDialog({ status }: InvoiceHelpDialogProps) {
  const actions = ACTIONS_BY_STATUS[status] ?? DRAFT_ACTIONS
  const footer = FOOTER_BY_STATUS[status]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          title="Ayuda"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Acciones de factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {actions.map(({ icon: Icon, label, description, color }) => (
            <div key={label} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[13px] font-medium text-foreground">{label}</p>
                <p className="text-[12px] leading-relaxed text-muted-foreground/70">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {footer && (
          <p className="text-[11px] text-muted-foreground/40 pt-1">
            {footer}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
