'use client'

import { whatsappLink, whatsappNumber } from '@features/collections/utils/whatsapp'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog'
import { Input } from '@shared/ui/input'
import { formatDate } from '@shared/utils/date'
import { Copy, Link2, Loader2, Mail, MessageCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClientRequestAction } from '../actions/client-request.actions'

interface RequestClientDataDialogProps {
  /** A client the user already has: the link asks them to update their data. Without it, a new client. */
  client?: { id: string; businessName: string; email: string | null; phone: string | null }
}

/** The message that goes with the link, in "usted": it usually goes to a company. */
function requestMessage(url: string, updating: boolean): string {
  return updating
    ? `Hola, buen día. Para seguir facturándole necesito confirmar sus datos fiscales. Puede actualizarlos aquí: ${url}`
    : `Hola, buen día. Para hacerle su factura necesito sus datos fiscales. Puede llenarlos aquí: ${url}`
}

/**
 * "Pedir datos a un cliente": a link where the client types their own fiscal data, to send by
 * WhatsApp, by email from the user's own mail, or copied.
 */
export function RequestClientDataDialog({ client }: RequestClientDataDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [link, setLink] = useState<{ url: string; expiresAt: Date } | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setLink(null)
      setLabel('')
    }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    const result = await createClientRequestAction(client ? { clientId: client.id } : { label })
    setIsCreating(false)
    if (!result.success) {
      toast.error('No se creó el link', { description: result.error })
      return
    }
    setLink({ url: result.request.url, expiresAt: result.request.expiresAt })
    router.refresh()
  }

  const handleCopy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link.url)
    toast.success('Link copiado')
  }

  const message = link ? requestMessage(link.url, !!client) : ''
  const number = client ? whatsappNumber(client.phone, null) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {client ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Pedir a ${client.businessName} que actualice sus datos`} title="Pedirle sus datos">
            <Send className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline">
            <Link2 />
            Pedir datos a un cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Pedirle que actualice sus datos' : 'Pedir datos a un cliente'}</DialogTitle>
          <DialogDescription>
            {client
              ? `Le mandas un link a ${client.businessName} para que corrija sus datos fiscales. Al terminar, te avisamos.`
              : 'Le mandas un link y tu cliente llena sus datos fiscales; si tiene su constancia, se llenan solos. Al terminar, queda en tus clientes y te avisamos.'}
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
          >
            {!client && (
              <div className="space-y-1.5">
                <label htmlFor="request-label" className="text-[13px] font-medium text-tinta-tenue">
                  ¿Cómo lo identificas?
                </label>
                <Input
                  id="request-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Kemper, la escuela"
                  maxLength={120}
                  autoFocus
                />
                <p className="text-[12px] text-tinta-tenue">Solo lo ves tú, mientras esperas sus datos.</p>
              </div>
            )}
            <Button type="submit" disabled={isCreating || (!client && !label.trim())}>
              {isCreating ? <Loader2 className="animate-spin" /> : <Link2 />}
              Crear link
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={link.url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Link para tu cliente"
                className="font-mono text-[12px]"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar link">
                <Copy />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={whatsappLink(number, message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  Mandar por WhatsApp
                </a>
              </Button>
              {client?.email && (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${client.email}?subject=${encodeURIComponent('Tus datos fiscales')}&body=${encodeURIComponent(message)}`}>
                    <Mail />
                    Mandar por correo
                  </a>
                </Button>
              )}
            </div>
            <p className="text-[12px] text-tinta-tenue">
              Sirve una vez y vence el {formatDate(link.expiresAt, { day: 'numeric', month: 'long' })}. Mientras tanto lo ves en Clientes,
              donde lo puedes copiar o cancelar.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
