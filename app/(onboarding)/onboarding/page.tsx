import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAllIssuingProfiles } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getTaxRegimeOptions } from '@shared/services/sat-catalog.service'
import { OnboardingWizard } from '@features/onboarding/components/onboarding-wizard'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // If user already has a profile, skip onboarding
  const profiles = await getAllIssuingProfiles(userId)
  if (profiles.length > 0) redirect('/dashboard')

  const taxRegimes = await getTaxRegimeOptions()

  return <OnboardingWizard taxRegimes={taxRegimes} />
}
