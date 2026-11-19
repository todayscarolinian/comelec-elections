import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RegistrationOcrHarness } from '@/components/dev/registration-ocr-harness'
import { isDevToolsEnabled } from '@/server/dev/session'

export const metadata: Metadata = {
  title: 'Registration OCR (dev)',
}

export default function RegistrationOcrDevPage() {
  if (!isDevToolsEnabled()) notFound()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Registration OCR (dev)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Runs the real upload and submit procedures with a dev session, then polls the Registration
          until OCR finishes. Available under next dev and on Vercel previews.
        </p>
      </header>
      <RegistrationOcrHarness />
    </main>
  )
}
