import { ArrowRight, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CandidateDef } from '@/election'
import { trackEvent } from '@/lib/analytics/client'
import { ballotInputSchema, type BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import { BallotCandidatePreview } from './ballot-candidate-preview'
import {
  BallotDisclosure,
  BallotIntro,
  BallotProgress,
  BallotQuestion,
  BallotReviewList,
  questions,
  type DraftAnswers,
  type QuestionId,
  type Step,
} from './ballot-steps'
import { ballotColumns, ballotEntrance, ballotLightAction } from './ballot-styles'

export function BallotFlow({
  held,
  pending,
  error,
  onCast,
}: {
  held: boolean
  pending: boolean
  error?: string
  onCast: (input: BallotInput) => void
}) {
  const [step, setStep] = useState<Step>('disclosure')
  useEffect(() => trackEvent('ballot_started'), [])
  const [disclosure, setDisclosure] = useState(false)
  const [heldAcknowledgement, setHeldAcknowledgement] = useState(false)
  const [answers, setAnswers] = useState<DraftAnswers>({})
  const [preview, setPreview] = useState<{ candidate: CandidateDef; office: string } | null>(null)
  const target = useRef<string>(null)

  useEffect(() => {
    if (target.current) {
      document.getElementById(target.current)?.focus()
      target.current = null
    }
  }, [step])

  function goTo(next: Step, question?: QuestionId) {
    target.current = question ?? 'ballot-heading'
    setStep(next)
  }

  const answered = questions.filter((question) => answers[question.id]).length
  const needsHeldAcknowledgement = held && !heldAcknowledgement

  function cast() {
    const input = ballotInputSchema.safeParse({
      answers,
      disclosureAccepted: disclosure,
      ...(heldAcknowledgement ? { heldAcknowledged: true } : {}),
    })
    if (!pending && !needsHeldAcknowledgement && input.success) onCast(input.data)
  }

  return (
    <>
      <BallotProgress step={step} />
      <div key={step} className={`grow py-10 sm:py-14 ${ballotEntrance}`}>
        {step === 'disclosure' && (
          <BallotDisclosure
            held={held}
            disclosure={disclosure}
            heldAcknowledgement={heldAcknowledgement}
            onDisclosure={setDisclosure}
            onHeldAcknowledgement={setHeldAcknowledgement}
            onContinue={() => goTo('ballot')}
          />
        )}

        {step === 'ballot' && (
          <div className={ballotColumns}>
            <div className="min-w-0 space-y-8">
              <BallotIntro
                heading="Your ballot."
                description="Choose candidates or abstain for every office. You can still change your choices before casting."
              />
              {questions.map((question) => (
                <BallotQuestion
                  key={question.id}
                  question={question}
                  answer={answers[question.id]}
                  onPreview={(candidate) => setPreview({ candidate, office: question.title })}
                  onAnswer={(answer) =>
                    setAnswers((current) => {
                      if (answer) return { ...current, [question.id]: answer }
                      const remaining = { ...current }
                      delete remaining[question.id]
                      return remaining
                    })
                  }
                />
              ))}
            </div>
            <aside className="space-y-5 bg-comelec-forest p-6 text-comelec-cream sm:p-8 lg:sticky lg:top-28">
              <h2 className="text-xs uppercase">Your progress</h2>
              <p className="text-2xl" aria-live="polite">
                {answered} of {questions.length} answered
              </p>
              <dl className="space-y-3 text-sm">
                {questions.map((question) => {
                  const answer = answers[question.id]
                  const status = !answer
                    ? 'Unanswered'
                    : 'abstain' in answer
                      ? 'Abstained'
                      : `${answer.candidateIds.length} chosen`
                  return (
                    <div key={question.id} className="flex justify-between gap-4">
                      <dt>{question.title}</dt>
                      <dd className="text-end">{status}</dd>
                    </div>
                  )
                })}
              </dl>
              <div className="space-y-3 border-t border-comelec-cream/30 pt-5">
                <button
                  type="button"
                  disabled={answered !== questions.length}
                  onClick={() => goTo('review')}
                  className={`${ballotLightAction} w-full`}
                >
                  Review ballot <ArrowRight aria-hidden="true" size={16} />
                </button>
                <p className="text-sm">Reviewing your ballot does not cast it.</p>
                <p className="flex items-center gap-2 text-xs">
                  <Check aria-hidden="true" size={14} /> Disclosure acknowledged
                </p>
              </div>
            </aside>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-8">
            <BallotIntro
              heading="Review your ballot."
              description="Check each office. You can edit your choices before you cast."
            />
            <div className={ballotColumns}>
              <BallotReviewList
                answers={answers}
                onEdit={(question) => goTo('ballot', question)}
                disabled={pending}
              />
              <aside className="space-y-5 bg-comelec-forest p-6 text-comelec-cream sm:p-8">
                <h2 className="font-display text-3xl italic">Ready to cast?</h2>
                <p>Your ballot is final and cannot be changed.</p>
                {needsHeldAcknowledgement ? (
                  <button
                    type="button"
                    onClick={() => goTo('disclosure')}
                    className={`${ballotLightAction} w-full`}
                  >
                    Review held ballot disclosure
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={cast}
                    className={`${ballotLightAction} w-full`}
                  >
                    {pending ? 'Casting ballot…' : 'Cast my ballot'}
                  </button>
                )}
                {error && (
                  <p role="alert" className="text-sm">
                    {error}
                  </p>
                )}
                <p className="text-xs">You can cast only one ballot.</p>
              </aside>
            </div>
          </div>
        )}
      </div>
      {preview && <BallotCandidatePreview {...preview} onClose={() => setPreview(null)} />}
    </>
  )
}
