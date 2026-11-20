import type { Metadata } from 'next'
import { RegistrationReview } from './registration-review'

export const metadata: Metadata = {
  title: 'Registration review · SSC COMELEC',
  description: 'Review voter registrations and student profiles.',
}

export default function RegistrationsPage() {
  return <RegistrationReview />
}
