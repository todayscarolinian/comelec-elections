import { ElectionFooterBrand } from '@/components/election/election-footer-brand'
import { ElectionFooterLinks } from '@/components/election/election-footer-links'
import { footerGutters } from '@/components/election/election-styles'

export function ElectionFooter() {
  return (
    <footer className="mt-auto">
      <div
        className={`${footerGutters} grid min-h-[7.5rem] items-center gap-x-8 gap-y-3 py-5 min-[64rem]:grid-cols-[auto_minmax(0,1fr)]`}
      >
        <ElectionFooterBrand />
        <ElectionFooterLinks />
      </div>
    </footer>
  )
}
