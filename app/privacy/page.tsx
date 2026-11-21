import { LegalPage } from '@/components/legal/legal-page'
import { PRIVACY_POLICY } from '@/content/legal/privacy'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: PRIVACY_POLICY.title,
  description: PRIVACY_POLICY.summary,
  path: '/privacy',
})

export default function Page() {
  return <LegalPage content={PRIVACY_POLICY} />
}
