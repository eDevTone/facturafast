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
import type { TaxRegimeOption } from '@shared/services/sat-catalog.service'

interface FiscalProfileStepProps {
  taxRegimes: TaxRegimeOption[]
  onBack: () => void
}

const SAT_CSD_GUIDE_URL = 'https://www.sat.gob.mx/portal/public/tramites/certificado-de-sello-digital'

export function FiscalProfileStep({ taxRegimes, onBack }: FiscalProfileStepProps) {
  const router = useRouter()

  const handleSubmit = async (input: CreateIssuingProfileInput) => {
    const result = await createIssuingProfileAction(input)
    if ('error' in result) throw new Error(result.error)
    toast.success('Tu RFC quedó registrado', { description: 'Ya puedes agregar clientes y facturar.' })
    router.push('/dashboard')
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </button>
        <h1 className="text-[22px] font-semibold tracking-tight text-tinta">
          Registra tu RFC
        </h1>
        <p className="mt-1.5 text-sm text-tinta-tenue">
          Estos datos aparecen como emisor en cada factura. Deben coincidir con tu constancia del SAT.
        </p>
      </div>

      {/* CSD Help Callout */}
      <div className="mb-6 border-l-2 border-sello pl-4">
        <p className="text-sm text-tinta-tenue">
          Para timbrar necesitas tu <span className="font-medium text-tinta">CSD</span>. Si lo tienes a la mano,
          súbelo abajo; si no, puedes agregarlo después en Perfiles fiscales.
        </p>
        <div className="mt-2">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-sello underline-offset-4 hover:underline"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                ¿Cómo obtengo mi CSD?
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cómo obtener tu CSD</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  El certificado de sello digital (CSD) lo emite el SAT y sirve para sellar tus facturas. Es
                  distinto de tu e.firma, aunque necesitas la e.firma para tramitarlo.
                </p>
                <ol className="list-decimal space-y-2 pl-4">
                  <li>
                    Entra al portal del SAT con tu e.firma
                  </li>
                  <li>
                    Abre <span className="font-medium text-foreground">CertiSAT Web</span>
                  </li>
                  <li>
                    Genera la solicitud de certificado de sello digital
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
                  className="inline-flex items-center gap-1.5 font-medium text-sello underline-offset-4 hover:underline"
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
        submitLabel="Guardar y continuar"
        showPaymentDetails={false}
      />
    </div>
  )
}
