import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'SSC Elections 2026 | COMELEC',
  description:
    'Meet the candidates, check election dates, and get ready to vote in the SSC Elections.',
}

export default function Home() {
  return <LandingPage />
}
