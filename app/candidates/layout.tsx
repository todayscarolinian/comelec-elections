import type { ReactNode } from 'react'
import { CandidatesFooter } from '@/components/candidates/candidates-footer'
import { ElectionNavigation } from '@/components/election/election-navigation'

export default function CandidatesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-comelec-cream font-sans text-comelec-forest [&_:is(a,button,input,select):focus-visible]:outline-2 [&_:is(a,button,input,select):focus-visible]:outline-offset-4 [&_:is(a,button,input,select):focus-visible]:outline-comelec-forest">
      <a
        href="#candidates-content"
        className="absolute start-4 top-4 z-30 -translate-y-[calc(100%+1rem)] bg-comelec-cream px-4 py-3 focus:translate-y-0"
      >
        Skip to content
      </a>
      <ElectionNavigation activeSection="candidates" variant="editorial" />
      <main
        id="candidates-content"
        tabIndex={-1}
        className="w-full flex-1 scroll-mt-36 outline-none"
      >
        {children}
      </main>
      <CandidatesFooter />
    </div>
  )
}
