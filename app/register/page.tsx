import type { Metadata } from 'next'
import { RegisterPage } from '@/components/registration/register-page'
import { RegistrationShell } from '@/components/registration/registration-shell'

export const metadata: Metadata = {
  title: 'Register to vote',
  description: 'Submit your Student Profile and check your election registration status.',
}

export default function Page() {
  return (
    <RegistrationShell>
      <RegisterPage />
    </RegistrationShell>
  )
}
