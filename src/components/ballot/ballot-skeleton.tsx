import { Bone, LoadingRegion, Repeat } from '@/components/skeleton'

/** Mirrors the progress steps and the disclosure step, the first thing most voters see. */
export function BallotSkeleton() {
  return (
    <LoadingRegion label="Loading ballot…" className="min-w-0 grow">
      <div className="flex flex-wrap gap-x-5 gap-y-3 border-b border-comelec-sage pb-4 sm:gap-x-14">
        <Repeat count={3}>{(index) => <Bone key={index} className="h-5 w-24" />}</Repeat>
      </div>
      <div className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-20">
        <div className="space-y-4">
          <Bone className="h-[clamp(2.75rem,5.2vw,4.25rem)] w-4/5" />
          <Bone className="h-[clamp(2.75rem,5.2vw,4.25rem)] w-1/2" />
          <div className="max-w-xl space-y-2 pt-1">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <Bone className="h-7 w-full" />
            <Bone className="h-7 w-3/5" />
            <div className="space-y-2 border-b border-comelec-sage pb-5">
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
            </div>
            <Bone className="h-14 w-full" />
          </div>
          <Bone className="h-12 w-52" />
        </div>
      </div>
    </LoadingRegion>
  )
}
