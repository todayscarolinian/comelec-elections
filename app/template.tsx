import { ViewTransition, type ReactNode } from 'react'

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter="election-page" exit="election-page">
      {children}
    </ViewTransition>
  )
}
