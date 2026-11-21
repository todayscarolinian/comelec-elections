import { Fraunces } from 'next/font/google'

export const fraunces = Fraunces({
  subsets: ['latin'],
  style: 'italic',
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--landing-fraunces',
})
