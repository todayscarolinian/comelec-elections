'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { StudentProfileUpload } from '@/components/registration/student-profile-upload'
import { CURRENT_TERM } from '@/election'
import { useTRPC } from '@/lib/trpc/client'
import {
  ocrResultSchema,
  YEAR_LEVEL_LABELS,
  YEAR_LEVELS,
  type YearLevel,
} from '@/server/trpc/api/v1/registration/schema'
import { DevTRPCProvider } from './dev-trpc-provider'

type Identity = { email: string; name: string }

type DevRegistration = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  yearLevel: string
  studentProfilePath: string
  submittedAt: string
  ocrStatus: 'PENDING' | 'DONE' | 'FAILED'
  ocrResult: unknown
}

const DEFAULT_IDENTITY: Identity = { email: '01234567@usc.edu.ph', name: 'Test Voter' }
const POLL_MS = 2000
const FIELDS = ['name', 'studentId', 'yearLevel', 'term'] as const
const FIELD_LABELS: Record<(typeof FIELDS)[number], string> = {
  name: 'Name',
  studentId: 'Student ID',
  yearLevel: 'Year Level',
  term: 'Term',
}

const inputClass =
  'mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
const buttonClass =
  'rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900'

export function RegistrationOcrHarness() {
  const [draft, setDraft] = useState<Identity>(DEFAULT_IDENTITY)
  const [identity, setIdentity] = useState<Identity>(DEFAULT_IDENTITY)

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">1. Test identity</h2>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            setIdentity({ email: draft.email.trim(), name: draft.name.trim() })
          }}
        >
          <label className="text-sm">
            Email
            <input
              className={inputClass}
              type="email"
              required
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.currentTarget.value })}
            />
          </label>
          <label className="text-sm">
            Name
            <input
              className={inputClass}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
            />
          </label>
          <button className={buttonClass} type="submit">
            Use identity
          </button>
        </form>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Acting as <strong>{identity.email}</strong>. Student ID is taken from the part before @.
        </p>
      </section>

      <DevTRPCProvider email={identity.email} name={identity.name}>
        <SubmissionPanel key={identity.email} identity={identity} />
      </DevTRPCProvider>
    </div>
  )
}

function SubmissionPanel({ identity }: Readonly<{ identity: Identity }>) {
  const trpc = useTRPC()
  const [path, setPath] = useState<string>()
  const [yearLevel, setYearLevel] = useState<YearLevel>('2')
  const submit = useMutation(trpc.registration.submit.mutationOptions())

  const registration = useQuery({
    queryKey: ['dev-registration', identity.email],
    queryFn: async (): Promise<DevRegistration | null> => {
      const response = await fetch(
        `/api/dev/registration?email=${encodeURIComponent(identity.email)}`,
      )
      if (!response.ok) throw new Error(`Status request failed (${response.status})`)
      const body: { registration: DevRegistration | null } = await response.json()
      return body.registration
    },
    refetchInterval: (query) => (query.state.data?.ocrStatus === 'PENDING' ? POLL_MS : false),
  })

  async function onSubmit() {
    if (!path) return
    await submit.mutateAsync({ yearLevel, studentProfilePath: path })
    await registration.refetch()
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">2. Upload and submit</h2>
        <div className="text-sm [&_input]:mt-1 [&_input]:block [&_p]:mt-1 [&_p]:text-zinc-600 dark:[&_p]:text-zinc-400">
          <StudentProfileUpload onUploaded={setPath} />
        </div>
        <label className="text-sm">
          Year Level
          <select
            className={inputClass}
            value={yearLevel}
            onChange={(event) => setYearLevel(event.currentTarget.value as YearLevel)}
          >
            {YEAR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {YEAR_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button
            className={buttonClass}
            type="button"
            disabled={!path || submit.isPending}
            onClick={() => void onSubmit().catch(() => undefined)}
          >
            {submit.isPending ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
        {path && <p className="font-mono text-xs text-zinc-500">{path}</p>}
        {submit.error && (
          <p role="alert" className="text-sm text-red-600">
            {submit.error.message}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">3. OCR result</h2>
        <OcrResultView
          identity={identity}
          registration={registration.data}
          error={registration.error?.message}
        />
      </section>
    </>
  )
}

function OcrResultView({
  identity,
  registration,
  error,
}: Readonly<{
  identity: Identity
  registration: DevRegistration | null | undefined
  error: string | undefined
}>) {
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (registration === undefined) return <p className="text-sm">Loading...</p>
  if (registration === null)
    return <p className="text-sm">No Registration for this identity yet.</p>

  const parsed = ocrResultSchema.safeParse(registration.ocrResult)
  const expected = {
    name: identity.name,
    studentId: identity.email.split('@')[0],
    yearLevel: registration.yearLevel,
    term: CURRENT_TERM,
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-zinc-500">Registration</dt>
        <dd>{registration.status}</dd>
        <dt className="text-zinc-500">OCR</dt>
        <dd>
          <StatusBadge status={registration.ocrStatus} />
        </dd>
        <dt className="text-zinc-500">Submitted</dt>
        <dd>{new Date(registration.submittedAt).toLocaleString()}</dd>
      </dl>

      {parsed.success && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-700">
                <th className="py-1 pr-4">Field</th>
                <th className="py-1 pr-4">Expected</th>
                <th className="py-1 pr-4">Extracted</th>
                <th className="py-1">Match</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => (
                <tr key={field} className="border-b border-zinc-200 dark:border-zinc-800">
                  <td className="py-1 pr-4">{FIELD_LABELS[field]}</td>
                  <td className="py-1 pr-4 font-mono">{expected[field]}</td>
                  <td className="py-1 pr-4 font-mono">{parsed.data.fields[field] || '—'}</td>
                  <td className="py-1">{parsed.data.matches[field] ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-zinc-500">Raw Registration</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
          {JSON.stringify(registration, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function StatusBadge({ status }: Readonly<{ status: DevRegistration['ocrStatus'] }>) {
  const colors = {
    PENDING: 'bg-amber-100 text-amber-900',
    DONE: 'bg-green-100 text-green-900',
    FAILED: 'bg-red-100 text-red-900',
  }
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status === 'PENDING' ? 'PENDING (polling...)' : status}
    </span>
  )
}
