'use client'

import { ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog'

import { createIssuingProfileAction } from '@features/fiscal-profile/actions/create-issuing-profile.action'
import { IssuingProfileForm } from '@features/fiscal-profile/components/issuing-profile-form'
import type { CreateIssuingProfileInput } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { CatalogOption } from '@shared/services/sat-catalog.service'

interface FiscalProfileStepProps {
  taxRegimes: CatalogOption[]
  onBack: () => void
}

const SAT_CSD_GUIDE_URL = 'https://www.sat.gob.mx/portal/public/tramites/certificado-de-sello-digital'

export function FiscalProfileStep({ taxRegimes, onBack }: FiscalProfileStepProps) {
  const router = useRouter()

  const handleSubmit = async (input: CreateIssuingProfileInput) => {
    await createIssuingProfileAction(input)
    toast.success('Perfil fiscal creado correctamente')
    router.push('/dashboard')
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configura tu perfil fiscal
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Necesitamos tus datos fiscales para generar facturas válidas ante el SAT.
        </p>
      </div>

      {/* CSD Help Callout */}
      <div className="mb-6 rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Necesitarás tus <span className="font-medium text-foreground">certificados CSD</span> para
          timbrar facturas. Si los tienes a la mano, súbelos ahora. Si no, puedes agregarlos
          después desde tu perfil.
        </p>
        <div className="mt-2">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                ¿Cómo obtener mis certificados?
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cómo obtener tus certificados CSD</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Los Certificados de Sello Digital (CSD) son emitidos por el SAT y necesarios
                  para firmar tus facturas electrónicas.
                </p>
                <ol className="list-decimal space-y-2 pl-4">
                  <li>
                    Ingresa al portal del SAT con tu e.firma (FIEL)
                  </li>
                  <li>
                    Ve a la sección <span className="font-medium text-foreground">CertiSAT Web</span>
                  </li>
                  <li>
                    Genera una solicitud de certificado de sello digital
                  </li>
                  <li>
                    Descarga tus archivos <span className="font-mono text-foreground">.cer</span> y{' '}
                    <span className="font-mono text-foreground">.key</span>
                  </li>
                  <li>
                    Guarda la contraseña que creaste al generar la solicitud
                  </li>
                </ol>
                <a
                  href={SAT_CSD_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Ir al portal del SAT
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reuse existing form */}
      <IssuingProfileForm
        onSubmit={handleSubmit}
        taxRegimes={taxRegimes}
        submitLabel="Crear perfil y continuar"
      />
    </div>
  )
}
