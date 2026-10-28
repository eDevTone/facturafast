'use client'

import { ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@shared/ui/dialog'

import { CSD_REQUEST_URL } from '../utils/csd-expiry'

interface CsdRenewalGuideProps {
  /** Classes for the trigger, to fit the line it sits in. */
  className?: string
}

/**
 * "Cómo tramitarlo": the SAT's three steps to get a new CSD (trámite 17507: Certifica, CertiSAT Web,
 * then the .cer under «Seguimiento de la solicitud»), and the link to the trámite.
 */
export function CsdRenewalGuide({ className }: CsdRenewalGuideProps) {
  return (
    <Dialog>
      <DialogTrigger className={cn('text-[13px] font-medium text-sello underline-offset-4 hover:underline', className)}>
        Cómo tramitarlo
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cómo tramitar un CSD nuevo</DialogTitle>
          <DialogDescription>Es gratis y se hace en línea, con tu e.firma vigente.</DialogDescription>
        </DialogHeader>

        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-tinta marker:font-mono marker:text-tinta-tenue">
          <li>
            En la aplicación Certifica del SAT, genera la solicitud del CSD. Te da un archivo <span className="font-mono">.sdg</span> y
            tu nueva llave <span className="font-mono">.key</span>, con la contraseña que elijas.
          </li>
          <li>
            Entra a CertiSAT Web con tu e.firma y envía el archivo <span className="font-mono">.sdg</span>.
          </li>
          <li>
            Cuando esté listo, descarga tu certificado <span className="font-mono">.cer</span> en «Seguimiento de la solicitud» y
            súbelo en Perfiles fiscales con la llave <span className="font-mono">.key</span> y su contraseña.
          </li>
        </ol>

        <a
          href={CSD_REQUEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sello underline-offset-4 hover:underline"
        >
          Ver el trámite en el sitio del SAT
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </DialogContent>
    </Dialog>
  )
}
