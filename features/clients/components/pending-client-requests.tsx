'use client'

import { Button } from '@shared/ui/button'
import { formatDate } from '@shared/utils/date'
import { Copy, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { cancelClientRequestAction } from '../actions/client-request.actions'
import type { PendingClientRequest } from '../services/client-request.service'

const shortDate = (date: Date) => formatDate(date, { day: 'numeric', month: 'short' })

/** "Esperando datos": the links sent to clients that have not filled them yet. */
export function PendingClientRequests({ requests }: { requests: PendingClientRequest[] }) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState<string | null>(null)

  if (requests.length === 0) return null

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.success('Link copiado')
  }

  const handleCancel = async (id: string) => {
    setCancelling(id)
    const result = await cancelClientRequestAction(id)
    setCancelling(null)
    if (!result.success) {
      toast.error('No se canceló el link', { description: result.error })
      return
    }
    toast.success('Link cancelado')
    router.refresh()
  }

  return (
    <section className="hoja px-5 py-3 sm:px-6" aria-labelledby="pending-requests-title">
      <h2 id="pending-requests-title" className="text-sm font-semibold">Esperando sus datos</h2>
      <ul className="mt-1 divide-y divide-renglon">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm">{request.label}</p>
              <p className="text-[12px] text-tinta-tenue">
                {request.clientId ? 'Para actualizar sus datos' : 'Cliente nuevo'} · link del {shortDate(request.createdAt)}, vence el{' '}
                {shortDate(request.expiresAt)}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleCopy(request.url)}>
                <Copy />
                Copiar link
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleCancel(request.id)} disabled={cancelling === request.id}>
                {cancelling === request.id ? <Loader2 className="animate-spin" /> : <X />}
                Cancelar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
