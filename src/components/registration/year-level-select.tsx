import * as Select from '@radix-ui/react-select'
import {
  YEAR_LEVELS,
  YEAR_LEVEL_LABELS,
  type YearLevel,
} from '@/server/trpc/api/v1/registration/schema'

type YearLevelSelectProps = {
  value?: YearLevel
  disabled: boolean
  onValueChange: (value: string) => void
}

export function YearLevelSelect({
  value,
  disabled,
  onValueChange,
}: Readonly<YearLevelSelectProps>) {
  return (
    <div className="space-y-2">
      <label htmlFor="year-level" className="block text-sm font-medium text-comelec-forest">
        Year level
      </label>
      <Select.Root value={value ?? ''} onValueChange={onValueChange} disabled={disabled} required>
        <Select.Trigger
          id="year-level"
          aria-describedby="year-level-hint"
          className="flex h-[58px] w-full cursor-pointer items-center justify-between gap-4 border border-comelec-sage bg-transparent px-4 text-left text-base text-comelec-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-comelec-forest disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-comelec-olive"
        >
          <Select.Value placeholder="Select your year level" />
          <Select.Icon asChild>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            aria-label="Year level"
            position="popper"
            sideOffset={4}
            collisionPadding={8}
            className="z-20 max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) overflow-hidden border border-comelec-sage bg-comelec-cream font-sans text-comelec-forest"
          >
            <Select.Viewport className="p-1">
              {YEAR_LEVELS.map((level) => (
                <Select.Item
                  key={level}
                  value={level}
                  className="flex min-h-11 cursor-pointer items-center px-3 text-base outline-none data-[highlighted]:bg-comelec-sage-soft data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-comelec-forest data-[state=checked]:bg-comelec-sage-soft data-[state=checked]:font-medium"
                >
                  <Select.ItemText>{YEAR_LEVEL_LABELS[level]}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <p id="year-level-hint" className="text-sm leading-relaxed text-comelec-olive">
        Your year level does not change your ballot.
      </p>
    </div>
  )
}
