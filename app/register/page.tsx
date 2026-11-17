import type { Metadata } from 'next'
import { RegisterPage } from '@/components/registration/register-page'

export const metadata: Metadata = {
  title: 'Register | COMELEC Elections',
  description: 'Submit your Student Profile and check your election registration status.',
}

export default function Page() {
  return <RegisterPage />
}
