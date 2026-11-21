export const ballotHeading =
  'scroll-mt-28 font-display text-[clamp(2.75rem,5.2vw,4.25rem)] leading-[1.02] italic'

export const ballotEntrance =
  'motion-safe:animate-[election-page-in_220ms_cubic-bezier(0.2,0.65,0.3,1)_backwards]'

const ballotButtonMotion =
  'motion-safe:transition-[background-color,color,scale] motion-safe:duration-150 motion-safe:ease-out motion-safe:enabled:active:scale-[0.99]'

export const ballotAction = `inline-flex min-h-12 items-center justify-center gap-2 bg-comelec-forest px-6 py-3 text-center text-sm font-medium text-comelec-cream enabled:cursor-pointer enabled:hover:bg-comelec-forest-dark disabled:bg-comelec-sage disabled:text-comelec-olive ${ballotButtonMotion}`

export const ballotLightAction = `inline-flex min-h-12 items-center justify-center gap-2 bg-comelec-cream px-6 py-3 text-center text-sm font-medium text-comelec-forest enabled:cursor-pointer enabled:hover:bg-comelec-sage-soft disabled:opacity-60 ${ballotButtonMotion}`

export const ballotTextAction =
  'inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium hover:underline hover:underline-offset-4'

export const ballotColumns =
  'grid items-start gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(16rem,1fr)] lg:gap-12'
