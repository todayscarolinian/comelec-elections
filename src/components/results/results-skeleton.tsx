import { ElectionNavigation } from '@/components/election/election-navigation'
import { electionContent, electionPageSpacing } from '@/components/election/election-styles'
import { ElectionFooter } from '@/components/landing/election-footer'
import { Bone, LoadingRegion, Repeat, boneWidths } from '@/components/skeleton'

/** Keeps the real navigation and footer in place while the release status is checked. */
export function ResultsPageSkeleton() {
  return (
    <div
      className={`${electionPageSpacing} flex min-h-svh flex-col bg-[#faf3e0] text-comelec-forest [font-family:var(--font-inter),Arial,sans-serif] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#324e1f]`}
    >
      <ElectionNavigation activeSection="turnout" />
      <main className={`${electionContent} flex-1 pb-12 pt-8`}>
        <LoadingRegion label="Loading results…">
          <div className="border-b border-comelec-sage pb-7">
            <Bone className="mb-3 h-2.5 w-44" />
            <Bone className="h-[clamp(2.25rem,4.5vw,3.5rem)] w-[min(28rem,80%)]" />
            <Bone className="mt-4 h-3.5 w-[min(32rem,90%)]" />
            <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
              <Bone className="h-5 w-44" />
              <Bone className="h-2.5 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 py-7 max-[42rem]:grid-cols-1">
            <Repeat count={4}>
              {(question) => (
                <div key={question}>
                  <Bone className="h-7 w-48" />
                  <Bone className="mt-3 mb-4 h-3 w-52" />
                  <div className="space-y-3">
                    <Repeat count={3}>
                      {(candidate) => (
                        <div key={candidate} className="space-y-1.5">
                          <div className="flex justify-between gap-4">
                            <Bone
                              className={`h-3.5 ${boneWidths[(candidate + question) % boneWidths.length]}`}
                            />
                            <Bone className="h-3.5 w-16" />
                          </div>
                          <Bone className="h-1.5 w-full" />
                        </div>
                      )}
                    </Repeat>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
        </LoadingRegion>
      </main>
      <ElectionFooter />
    </div>
  )
}
