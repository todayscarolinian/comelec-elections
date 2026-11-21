import type { Metadata } from 'next'
import { RegistrationReview } from '@/components/admin/registration-review/registration-review'

export const metadata: Metadata = {
  title: 'Registration review · SSC COMELEC',
  description: 'Review voter registrations and student profiles.',
}

export default function RegistrationsPage() {
  return <RegistrationReview />
}
