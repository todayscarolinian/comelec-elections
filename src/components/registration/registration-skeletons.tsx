import { Bone, LoadingRegion } from '@/components/skeleton'
import { registrationPanel } from './registration-styles'

/** Mirrors the sign-in and sign-in error panels: heading, copy, Google button, back link. */
export function SignInPanelSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label} className={registrationPanel}>
      <div className="max-w-[35rem] space-y-6">
        <div className="space-y-4">
          <Bone className="h-[clamp(2.75rem,3.9vw,3.5rem)] w-4/5" />
          <Bone className="h-[clamp(2.75rem,3.9vw,3.5rem)] w-3/5" />
          <div className="space-y-2 pt-1">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>
        <Bone className="h-[3.25rem] w-full" />
        <Bone className="h-3.5 w-3/4" />
        <div className="border-t border-comelec-sage pt-3">
          <Bone className="my-3.5 h-4 w-32" />
        </div>
      </div>
    </LoadingRegion>
  )
}

/** Placeholder for the account summary and form below the registration heading. */
export function RegistrationStatusSkeleton() {
  return (
    <LoadingRegion label="Loading registration…" className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-4 w-full max-w-[36rem]" />
        <Bone className="h-4 w-1/2" />
      </div>
      <div className="space-y-4 border-y border-comelec-sage py-5">
        <div className="space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3.5 w-56 max-w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Bone className="h-3.5 w-24" />
        <Bone className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Bone className="h-3.5 w-32" />
        <Bone className="h-28 w-full" />
      </div>
      <Bone className="h-[3.25rem] w-full" />
    </LoadingRegion>
  )
}
