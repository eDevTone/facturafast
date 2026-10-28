'use client'

import { whatsappLink } from '@features/collections/utils/whatsapp'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select'
import { formatDate } from '@shared/utils/date'
import { Copy, Download, FileSpreadsheet, FolderDown, Link2, Loader2, MessageCircle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  createAccountantLinkAction,
  downloadMonthCsvAction,
  downloadMonthZipAction,
  getAccountantPanelAction,
  revokeAccountantLinkAction,
} from '../actions/accountant.actions'
import type { AccountantLinkView } from '../services/accountant-link.service'
import type { MonthCount } from '../services/month-package.service'
import { saveTextFile } from '../utils/save-file'

interface Panel {
  profiles: { id: string; rfc: string; businessName: string }[]
  profileId: string
  months: MonthCount[]
  link: AccountantLinkView | null
}

/** Last month when it has CFDI (the usual package), else the newest month that has some. */
function defaultMonth(months: MonthCount[]): string | null {
  if (months[1]?.documents) return months[1].month
  return months.find((month) => month.documents > 0)?.month ?? months[0]?.month ?? null
}

function documentsLabel(count: number): string {
  return count === 0 ? 'sin facturas' : count === 1 ? '1 documento' : `${count} documentos`
}

/**
 * "Para tu contador": the month's XML and PDF in a ZIP with a CSV summary, and the private link
 * that lets the accountant download them without an account.
 */
export function AccountantDialog() {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [month, setMonth] = useState<string | null>(null)
  const [isLoading, startLoading] = useTransition()
  const [busy, setBusy] = useState<'zip' | 'csv' | 'link' | 'revoke' | null>(null)

  const load = (profileId?: string) => {
    startLoading(async () => {
      const result = await getAccountantPanelAction(profileId)
      if (!result.success) {
        toast.error('No pudimos cargar tus meses', { description: result.error })
        return
      }
      setPanel(result)
      setMonth(defaultMonth(result.months))
    })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) load(panel?.profileId)
  }

  const selected = panel?.months.find((item) => item.month === month) ?? null
  const isCurrentMonth = !!panel && month === panel.months[0]?.month
  const canDownload = !!panel && !!selected && selected.documents > 0 && !busy

  const handleZip = async () => {
    if (!panel || !month) return
    setBusy('zip')
    const result = await downloadMonthZipAction(panel.profileId, month)
    setBusy(null)
    if (!result.success) {
      toast.error('No se armó el paquete', { description: result.error })
      return
    }
    window.location.assign(result.url)
    toast.success(`Bajando ${result.filename}`, {
      description: result.missing > 0
        ? `Faltaron ${result.missing} archivos; el ZIP trae un LEEME con cuáles.`
        : documentsLabel(result.documents),
    })
  }

  const handleCsv = async () => {
    if (!panel || !month) return
    setBusy('csv')
    const result = await downloadMonthCsvAction(panel.profileId, month)
    setBusy(null)
    if (!result.success) {
      toast.error('No se armó el resumen', { description: result.error })
      return
    }
    saveTextFile(result.csv, result.filename, 'text/csv;charset=utf-8')
  }

  const handleCreateLink = async () => {
    if (!panel) return
    const replacing = !!panel.link
    setBusy('link')
    const result = await createAccountantLinkAction(panel.profileId)
    setBusy(null)
    if (!result.success) {
      toast.error('No se creó el link', { description: result.error })
      return
    }
    setPanel({ ...panel, link: result.link })
    toast.success(replacing ? 'Link nuevo listo' : 'Link listo', {
      description: replacing ? 'El anterior ya no funciona.' : 'Cópialo y mándaselo a tu contador.',
    })
  }

  const handleRevoke = async () => {
    if (!panel) return
    setBusy('revoke')
    const result = await revokeAccountantLinkAction(panel.profileId)
    setBusy(null)
    if (!result.success) {
      toast.error('No se canceló el link', { description: result.error })
      return
    }
    setPanel({ ...panel, link: null })
    toast.success('Link cancelado', { description: 'Ya no abre tus facturas.' })
  }

  const handleCopy = async () => {
    if (!panel?.link) return
    await navigator.clipboard.writeText(panel.link.url)
    toast.success('Link copiado')
  }

  const profile = panel?.profiles.find((item) => item.id === panel.profileId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderDown />
          Para tu contador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Para tu contador</DialogTitle>
          <DialogDescription>
            Los XML y PDF de un mes, con un resumen que abre en Excel. O un link para que tu contador los baje él.
          </DialogDescription>
        </DialogHeader>

        {!panel ? (
          <div className="flex h-40 items-center justify-center text-tinta-tenue">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Cargando" /> : 'No pudimos cargar tus meses.'}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3" aria-labelledby="package-title">
              <h3 id="package-title" className="text-sm font-semibold">Descargar un mes</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {panel.profiles.length > 1 && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="package-profile" className="text-[13px] font-medium text-tinta-tenue">RFC</label>
                    <Select value={panel.profileId} onValueChange={(value) => load(value)} disabled={isLoading}>
                      <SelectTrigger id="package-profile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {panel.profiles.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            <span className="font-mono">{item.rfc}</span> {item.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="package-month" className="text-[13px] font-medium text-tinta-tenue">Mes</label>
                  <Select value={month ?? undefined} onValueChange={setMonth} disabled={isLoading}>
                    <SelectTrigger id="package-month">
                      <SelectValue placeholder="Elige el mes" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {panel.months.map((item) => (
                        <SelectItem key={item.month} value={item.month}>
                          {item.label} <span className="text-tinta-tenue">· {documentsLabel(item.documents)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected?.documents === 0 ? (
                    <p className="text-[12px] text-tinta-tenue">Ese mes no tiene facturas ni complementos timbrados.</p>
                  ) : isCurrentMonth ? (
                    <p className="text-[12px] text-tinta-tenue">El mes no ha terminado: trae lo timbrado hasta hoy.</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleZip} disabled={!canDownload}>
                  {busy === 'zip' ? <Loader2 className="animate-spin" /> : <Download />}
                  {busy === 'zip' ? 'Armando el ZIP…' : 'Descargar ZIP'}
                </Button>
                <Button variant="outline" onClick={handleCsv} disabled={!canDownload}>
                  {busy === 'csv' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
                  Solo el resumen
                </Button>
              </div>
            </section>

            <section className="space-y-3 border-t border-renglon pt-5" aria-labelledby="link-title">
              <div>
                <h3 id="link-title" className="text-sm font-semibold">Link para tu contador</h3>
                <p className="mt-1 text-[13px] text-tinta-tenue">
                  Con él baja cualquier mes{profile && panel.profiles.length > 1 ? ` de ${profile.rfc}` : ''}, sin entrar a tu
                  cuenta. Quien tenga el link puede bajar tus facturas: cancélalo cuando deje de llevar tu contabilidad.
                </p>
              </div>

              {panel.link ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={panel.link.url}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label="Link para tu contador"
                      className="font-mono text-[12px]"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar link">
                      <Copy />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={whatsappLink(null, `Hola, con este link puedes bajar mis facturas de cada mes (XML, PDF y un resumen): ${panel.link.url}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle />
                        Mandar por WhatsApp
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCreateLink} disabled={!!busy}>
                      {busy === 'link' && <Loader2 className="animate-spin" />}
                      Crear uno nuevo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRevoke} disabled={!!busy} className="text-destructive hover:text-destructive">
                      {busy === 'revoke' && <Loader2 className="animate-spin" />}
                      Cancelar link
                    </Button>
                  </div>
                  <p className="text-[12px] text-tinta-tenue">
                    Creado el {formatDate(panel.link.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}.{' '}
                    {panel.link.lastUsedAt
                      ? `Tu contador lo abrió por última vez el ${formatDate(panel.link.lastUsedAt, { day: 'numeric', month: 'short' })}.`
                      : 'Tu contador aún no lo abre.'}
                  </p>
                </>
              ) : (
                <Button variant="outline" onClick={handleCreateLink} disabled={!!busy}>
                  {busy === 'link' ? <Loader2 className="animate-spin" /> : <Link2 />}
                  Crear link
                </Button>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
