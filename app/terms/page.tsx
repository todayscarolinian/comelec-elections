import { LegalPage } from '@/components/legal/legal-page'
import { TERMS_OF_SERVICE } from '@/content/legal/terms'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: TERMS_OF_SERVICE.title,
  description: TERMS_OF_SERVICE.summary,
  path: '/terms',
})

export default function Page() {
  return <LegalPage content={TERMS_OF_SERVICE} />
}
