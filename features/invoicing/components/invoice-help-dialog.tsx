'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { LucideIcon } from 'lucide-react'
import { Ban, Copy, Download, Eye, FilePen, Files, HelpCircle, Pencil, Send, Trash2 } from 'lucide-react'

interface HelpAction {
  icon: LucideIcon
  label: string
  description: string
  color: string
}

const DRAFT_ACTIONS: HelpAction[] = [
  {
    icon: Eye,
    label: 'Vista previa',
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
    icon: Files,
    label: 'Duplicar',
    description: 'Crea un borrador nuevo con el mismo cliente y conceptos. Útil para igualas mensuales.',
    color: 'text-muted-foreground',
  },
  {
    icon: Copy,
    label: 'Copiar UUID',
    description: 'Copia el folio fiscal (UUID) al portapapeles. Útil para referencias con clientes o el SAT.',
    color: 'text-muted-foreground',
  },
  {
    icon: FilePen,
    label: 'Corregir factura',
    description: 'Crea un borrador igual para que cambies lo que estaba mal. Al timbrarlo, pedimos al SAT cancelar esta con el motivo 01 (sustitución).',
    color: 'text-muted-foreground',
  },
  {
    icon: Ban,
    label: 'Cancelar',
    description: 'Pide la cancelación al SAT con un motivo. Si tu cliente tiene que aceptarla, la factura queda "En cancelación" hasta que responda; tiene 3 días hábiles.',
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
    description: 'Comprobante del SAT de que recibió la solicitud de cancelación. Consérvalo para auditorías y registros contables.',
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
  timbrada: 'Una cancelación aceptada por el SAT no se puede deshacer. Cancelar no gasta timbres.',
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
          className="flex h-7 w-7 items-center justify-center rounded-md text-tinta-tenue hover:text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
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
                <p className="text-[12px] leading-relaxed text-tinta-tenue">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {footer && (
          <p className="text-[11px] text-tinta-tenue pt-1">
            {footer}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
