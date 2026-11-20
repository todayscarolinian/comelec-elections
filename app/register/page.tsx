import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterPage, type RegistrationApplicant } from '@/components/registration/register-page'
import prisma from '@/lib/prisma'
import { auth } from '@/server/auth'

export const metadata: Metadata = {
  title: 'Register | SSC COMELEC Elections',
  description: 'Submit your Student Profile and check your election registration status.',
}

async function getSignedInApplicant(): Promise<RegistrationApplicant | null> {
  const session = await auth()
  if (!session?.user?.personId) return null

  const person = await prisma.person.findUnique({
    where: { id: session.user.personId },
    select: { name: true, email: true },
  })

  if (person) return person
  return { name: session.user.email, email: session.user.email }
}

async function RegisterPageWithApplicant() {
  const applicant = await getSignedInApplicant()
  return <RegisterPage applicant={applicant} />
}

export default function Page() {
  return (
    <Suspense fallback={<RegisterPage />}>
      <RegisterPageWithApplicant />
    </Suspense>
  )
}
