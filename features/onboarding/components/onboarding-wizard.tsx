'use client'

import type { TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { Logo } from '@shared/components/logo'
import { useState } from 'react'
import { FiscalProfileStep } from './fiscal-profile-step'
import { WelcomeStep } from './welcome-step'

interface OnboardingWizardProps {
  taxRegimes: TaxRegimeOption[]
}

const TOTAL_STEPS = 2

export function OnboardingWizard({ taxRegimes }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)

  return (
    <div className="flex min-h-screen justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <p className="text-[13px] text-tinta-tenue" aria-live="polite">
            Paso <span className="font-mono text-tinta">{step + 1}</span> de{' '}
            <span className="font-mono">{TOTAL_STEPS}</span>
          </p>
        </div>

        <div className="hoja p-6 sm:p-8">
          {step === 0 && <WelcomeStep onContinue={() => setStep(1)} />}
          {step === 1 && <FiscalProfileStep taxRegimes={taxRegimes} onBack={() => setStep(0)} />}
        </div>
      </div>
    </div>
  )
}
