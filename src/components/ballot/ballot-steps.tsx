import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { CandidatePortrait } from '@/components/candidates/candidate-portrait'
import { ELECTION, type CandidateDef, type QuestionDef } from '@/election'
import type { BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import {
  ballotAction,
  ballotEntrance,
  ballotHeading,
  ballotOptionBorder,
  ballotTextAction,
} from './ballot-styles'

export const questions = ELECTION.questions
export type QuestionId = (typeof questions)[number]['id']
export type Answer = BallotInput['answers'][QuestionId]
export type DraftAnswers = Partial<BallotInput['answers']>
export type Step = 'disclosure' | 'ballot' | 'review'

export function BallotProgress({ step }: { step: Step | 'complete' }) {
  const steps = ['disclosure', 'ballot', 'review'] as const
  const current = step === 'complete' ? steps.length : steps.indexOf(step)

  return (
    <ol
      aria-label="Ballot progress"
      className="flex flex-wrap gap-x-5 gap-y-3 border-b border-comelec-sage pb-4 text-sm sm:gap-x-14"
    >
      {steps.map((item, index) => (
        <li
          key={item}
          aria-current={item === step ? 'step' : undefined}
          className={`inline-flex items-center gap-2 capitalize ${index > current ? 'text-comelec-olive' : 'font-medium'}`}
        >
          {index < current ? (
            <>
              <Check aria-hidden="true" size={15} className={ballotEntrance} />
              <span className="sr-only">Completed </span>
            </>
          ) : (
            <span aria-hidden="true" className="text-xs tabular-nums">
              0{index + 1}
            </span>
          )}
          {item}
        </li>
      ))}
    </ol>
  )
}

export function BallotIntro({ heading, description }: { heading: string; description: string }) {
  return (
    <header className="space-y-4">
      <h1 id="ballot-heading" tabIndex={-1} className={ballotHeading}>
        {heading}
      </h1>
      <p className="max-w-xl leading-relaxed text-comelec-olive">{description}</p>
    </header>
  )
}

function Acknowledgement({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: string
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 border border-comelec-sage p-4 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-comelec-forest"
      />
      {children}
    </label>
  )
}

export function BallotDisclosure({
  held,
  disclosure,
  heldAcknowledgement,
  onDisclosure,
  onHeldAcknowledgement,
  onContinue,
}: {
  held: boolean
  disclosure: boolean
  heldAcknowledgement: boolean
  onDisclosure: (checked: boolean) => void
  onHeldAcknowledgement: (checked: boolean) => void
  onContinue: () => void
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-20">
      <BallotIntro
        heading="Before you vote."
        description="One ballot per voter. You’ll review your choices before casting."
      />
      <div className="space-y-6">
        <section aria-labelledby="disclosure-heading" className="space-y-4">
          <h2 id="disclosure-heading" className="font-editorial text-2xl">
            Your ballot is not anonymous to the election commission.
          </h2>
          <p className="border-b border-comelec-sage pb-5 leading-relaxed text-comelec-olive">
            Your choices are recorded under your name and can be viewed by the commission to audit
            the election. Candidates and other voters cannot see your choices. Every time the
            commission views ballots, it is logged.
          </p>
          <Acknowledgement checked={disclosure} onChange={onDisclosure}>
            I understand that my ballot can be viewed by the election commission.
          </Acknowledgement>
        </section>
        {held && (
          <section aria-labelledby="held-disclosure-heading" className="space-y-4">
            <h2 id="held-disclosure-heading" className="font-editorial text-2xl">
              Your ballot will be held until your registration is approved.
            </h2>
            <p className="leading-relaxed text-comelec-olive">
              If your registration is rejected, correct it before voting closes so it can still be
              reviewed.
            </p>
            <Acknowledgement checked={heldAcknowledgement} onChange={onHeldAcknowledgement}>
              I understand that my ballot only counts if my registration is approved.
            </Acknowledgement>
          </section>
        )}
        <button
          type="button"
          disabled={!disclosure || (held && !heldAcknowledgement)}
          onClick={onContinue}
          className={ballotAction}
        >
          Continue to ballot <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  )
}

export function BallotQuestion({
  question,
  answer,
  onAnswer,
  onPreview,
}: {
  question: QuestionDef
  answer?: Answer
  onAnswer: (answer: Answer | undefined) => void
  onPreview: (candidate: CandidateDef) => void
}) {
  const selected = answer && 'candidateIds' in answer ? answer.candidateIds : []
  const abstained = Boolean(answer && 'abstain' in answer)
  const single = question.selectionLimit === 1
  const optionLabel = 'flex min-h-16 cursor-pointer items-center p-4 text-sm'

  return (
    <fieldset
      id={question.id}
      tabIndex={-1}
      className="min-w-0 scroll-mt-28 space-y-3"
      aria-describedby={`${question.id}-limit`}
    >
      <legend className="font-editorial text-3xl">{question.title}</legend>
      <p
        id={`${question.id}-limit`}
        className="border-b border-comelec-sage pb-3 text-sm text-comelec-olive"
      >
        {single
          ? 'Choose 1 candidate or abstain.'
          : `Choose up to ${question.selectionLimit} candidates or abstain.`}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.candidates.map((candidate) => {
          const checked = selected.includes(candidate.id)
          const atLimit = !single && !checked && selected.length >= question.selectionLimit
          return (
            <div
              key={candidate.id}
              className={`flex min-w-0 items-center ${ballotOptionBorder(checked)}`}
            >
              <label
                aria-label={candidate.name}
                className={`${optionLabel} min-w-0 flex-1 gap-2.5 pe-2 ${atLimit ? 'cursor-default opacity-65' : ''}`}
              >
                <input
                  type={single ? 'radio' : 'checkbox'}
                  name={question.id}
                  checked={checked}
                  disabled={atLimit}
                  className="size-5 shrink-0 accent-current"
                  onChange={() => {
                    const candidateIds = single
                      ? [candidate.id]
                      : checked
                        ? selected.filter((id) => id !== candidate.id)
                        : [...selected, candidate.id]
                    onAnswer(candidateIds.length ? { candidateIds } : undefined)
                  }}
                />
                <CandidatePortrait
                  candidate={candidate}
                  sizes="48px"
                  className="max-w-12 shrink-0"
                />
                <span className="min-w-0 wrap-anywhere">
                  <span className="block font-medium">{candidate.name}</span>
                  <span
                    className={`mt-1 block text-xs ${checked ? 'text-comelec-cream/85' : 'text-comelec-olive'}`}
                  >
                    {candidate.party ?? 'Independent'}
                  </span>
                </span>
              </label>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Details for ${candidate.name}`}
                className="me-3 inline-flex min-h-11 shrink-0 cursor-pointer items-center border border-current px-2.5 text-xs font-medium hover:underline"
                onClick={(event) => {
                  event.currentTarget.focus({ preventScroll: true })
                  onPreview(candidate)
                }}
              >
                Details
              </button>
            </div>
          )
        })}
      </div>
      <label
        className={`${optionLabel} gap-3 ${ballotOptionBorder(abstained)}`}
        aria-label="Abstain"
      >
        <input
          type={single ? 'radio' : 'checkbox'}
          name={question.id}
          checked={abstained}
          className="size-5 shrink-0 accent-current"
          onChange={() => onAnswer(abstained ? undefined : { abstain: true })}
        />
        <span>
          <span className="block font-medium">Abstain</span>
          <span
            className={`mt-1 block text-xs ${abstained ? 'text-comelec-cream/85' : 'text-comelec-olive'}`}
          >
            I choose no one for this office.
          </span>
        </span>
      </label>
    </fieldset>
  )
}

export function BallotReviewList({
  answers,
  onEdit,
  disabled,
}: {
  answers: DraftAnswers
  onEdit: (question?: QuestionId) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-6">
      {questions.map((question) => {
        const answer = answers[question.id]
        const selected = answer && 'candidateIds' in answer ? answer.candidateIds : []
        const candidates: readonly CandidateDef[] = question.candidates
        return (
          <section
            key={question.id}
            aria-label={question.title}
            className="space-y-2 border-b border-comelec-sage pb-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-editorial text-2xl">{question.title}</h2>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onEdit(question.id)}
                className={ballotTextAction}
                aria-label={`Edit ${question.title}`}
              >
                Edit <ArrowUpRight aria-hidden="true" size={15} />
              </button>
            </div>
            {selected.length > 0 ? (
              <ul className="space-y-2">
                {candidates
                  .filter((candidate) => selected.includes(candidate.id))
                  .map((candidate) => (
                    <li key={candidate.id}>
                      {candidate.name}{' '}
                      <span className="text-sm text-comelec-olive">
                        · {candidate.party ?? 'Independent'}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p>Abstain</p>
            )}
          </section>
        )
      })}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onEdit()}
        className={ballotTextAction}
      >
        <ArrowLeft aria-hidden="true" size={16} /> Back to edit choices
      </button>
    </div>
  )
}
