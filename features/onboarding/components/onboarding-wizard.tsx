'use client'

import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { useState } from 'react'
import { FiscalProfileStep } from './fiscal-profile-step'
import { WelcomeStep } from './welcome-step'

interface OnboardingWizardProps {
  taxRegimes: CatalogOption[]
}

export function OnboardingWizard({ taxRegimes }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div
            className={`h-1.5 w-8 rounded-full transition-colors ${
              step === 0 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-1.5 w-8 rounded-full transition-colors ${
              step === 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
        </div>

        {/* Steps */}
        <div className="relative">
          {step === 0 && (
            <WelcomeStep onContinue={() => setStep(1)} />
          )}
          {step === 1 && (
            <FiscalProfileStep
              taxRegimes={taxRegimes}
              onBack={() => setStep(0)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
