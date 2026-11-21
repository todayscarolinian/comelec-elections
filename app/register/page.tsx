import { RegisterPage } from '@/components/registration/register-page'
import { RegistrationShell } from '@/components/registration/registration-shell'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Register to vote',
  description: 'Submit your Student Profile and check your election registration status.',
  path: '/register',
})

export default function Page() {
  return (
    <RegistrationShell>
      <RegisterPage />
    </RegistrationShell>
  )
}
