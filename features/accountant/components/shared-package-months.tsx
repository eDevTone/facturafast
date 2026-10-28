'use client'

import { Button } from '@shared/ui/button'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { downloadSharedCsvAction, downloadSharedZipAction } from '../actions/shared-package.actions'
import type { MonthCount } from '../services/month-package.service'
import { saveTextFile } from '../utils/save-file'

/** The accountant's months: each one downloads as a ZIP or as its CSV summary. */
export function SharedPackageMonths({ token, months }: { token: string; months: MonthCount[] }) {
  const [busy, setBusy] = useState<string | null>(null)

  const handleZip = async (month: string) => {
    setBusy(`zip-${month}`)
    const result = await downloadSharedZipAction(token, month)
    setBusy(null)
    if (!result.success) {
      toast.error('No se pudo bajar', { description: result.error })
      return
    }
    window.location.assign(result.url)
  }

  const handleCsv = async (month: string) => {
    setBusy(`csv-${month}`)
    const result = await downloadSharedCsvAction(token, month)
    setBusy(null)
    if (!result.success) {
      toast.error('No se pudo bajar', { description: result.error })
      return
    }
    saveTextFile(result.csv, result.filename, 'text/csv;charset=utf-8')
  }

  return (
    <ul className="hoja divide-y divide-renglon">
      {months.map((item) => (
        <li key={item.month} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5 sm:px-6">
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-[12px] text-tinta-tenue">
              {item.documents === 0 ? 'Sin facturas timbradas' : item.documents === 1 ? '1 documento' : `${item.documents} documentos`}
            </p>
          </div>
          {item.documents > 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleZip(item.month)} disabled={!!busy}>
                {busy === `zip-${item.month}` ? <Loader2 className="animate-spin" /> : <Download />}
                ZIP
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCsv(item.month)} disabled={!!busy}>
                {busy === `csv-${item.month}` ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
                Resumen
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
