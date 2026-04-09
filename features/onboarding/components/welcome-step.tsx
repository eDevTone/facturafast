'use client'

import { FileText, Lock, Receipt, Zap } from 'lucide-react'
import { Button } from '@shared/ui/button'

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
        <Receipt className="h-6 w-6 text-primary-foreground" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Bienvenido a FacturaFast
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Facturación electrónica simple, rápida y sin complicaciones
      </p>

      {/* Value Props */}
      <div className="mt-8 w-full space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/30 px-4 py-3 text-left">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Timbra en segundos</p>
            <p className="text-xs text-muted-foreground">CFDI 4.0 válido ante el SAT</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/30 px-4 py-3 text-left">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">XML + PDF automáticos</p>
            <p className="text-xs text-muted-foreground">Descarga o envía por email al instante</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/30 px-4 py-3 text-left">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Tus datos seguros</p>
            <p className="text-xs text-muted-foreground">Certificados encriptados, nunca compartidos</p>
          </div>
        </div>
      </div>

      {/* Free Stamps Card */}
      <div className="mt-6 w-full rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Tienes <span className="text-primary">3 timbres gratis</span> para probar
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Sin tarjeta de crédito</p>
      </div>

      {/* CTA */}
      <Button onClick={onContinue} className="mt-8 w-full" size="lg">
        Comenzar
      </Button>
    </div>
  )
}
