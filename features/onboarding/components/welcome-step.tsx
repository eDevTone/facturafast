'use client'

import { Button } from '@shared/ui/button'

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-tinta">Vamos a dejar lista tu cuenta</h1>
      <p className="mt-2 max-w-prose text-sm text-tinta-tenue">
        En el siguiente paso registras el RFC con el que facturas. Con eso ya puedes crear facturas y timbrarlas ante el
        SAT; las retenciones de ISR e IVA se calculan solas cuando le facturas a una empresa.
      </p>

      <div className="mt-6 border-t border-renglon pt-5">
        <h2 className="text-[13px] font-medium text-tinta-tenue">Ten a la mano</h2>
        <ul className="mt-3 space-y-3 text-sm text-tinta">
          <li>
            <p className="font-medium">Tu Constancia de Situación Fiscal en PDF</p>
            <p className="text-[13px] text-tinta-tenue">Con ella llenamos tu RFC, nombre, régimen y código postal.</p>
          </li>
          <li>
            <p className="font-medium">
              Tu CSD: archivos <span className="font-mono">.cer</span> y <span className="font-mono">.key</span>, y su
              contraseña
            </p>
            <p className="text-[13px] text-tinta-tenue">
              Es el certificado de sello digital que tramitas en CertiSAT, no tu e.firma. Si aún no lo tienes, puedes
              subirlo después.
            </p>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-renglon pt-5">
        <p className="text-sm text-tinta">
          Tienes <span className="font-mono font-medium text-sello">3</span> timbres para probar, sin tarjeta.
        </p>
        <Button onClick={onContinue} size="lg">
          Registrar mi RFC
        </Button>
      </div>
    </div>
  )
}
