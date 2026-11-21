'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'
import { registrationHeading } from './registration-styles'
import './student-profile-tutorial.css'

const buttonStyle =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.98]'

const steps = [
  {
    title: 'Log in to ISMIS',
    description: 'Open USC’s ISMIS portal and log in with your student credentials.',
    image: 'ismis-sign-in',
    alt: 'ISMIS login page with the student login form highlighted.',
  },
  {
    title: 'Open My Profile',
    description: 'Click the profile picture in the top-right corner, then choose My Profile.',
    image: 'ismis-my-profile',
    alt: 'ISMIS header with the profile picture and My Profile menu option highlighted.',
  },
  {
    title: 'Take a screenshot',
    description:
      'Capture the full Student Profile window. Make sure your name, student ID, year level, and current term are readable.',
    image: 'ismis-student-profile',
    alt: 'Example Student Profile window with the area to capture highlighted.',
  },
]

/** Shows students where to find the screenshot required for registration. */
export function StudentProfileTutorial() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dialogId = useId()
  const titleId = `${dialogId}-title`
  const descriptionId = `${dialogId}-description`
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const firstStep = stepIndex === 0
  const lastStep = stepIndex === steps.length - 1

  function showStep(index: number) {
    setStepIndex(index)
    if (dialogRef.current) dialogRef.current.scrollTop = 0
  }

  function close() {
    dialogRef.current?.close()
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls={dialogId}
        className="block w-fit cursor-pointer text-start text-sm leading-relaxed font-medium text-comelec-forest underline underline-offset-4"
        onClick={() => {
          showStep(0)
          dialogRef.current?.showModal()
        }}
      >
        Where do I find my Student Profile?
      </button>
      <dialog
        id={dialogId}
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        closedby="any"
        className="student-profile-tutorial m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),45rem)] overflow-y-auto overscroll-contain border border-comelec-sage bg-comelec-cream p-5 text-comelec-forest shadow-[0_18px_44px_rgba(10,20,5,0.24)] sm:px-[31px]"
      >
        <header className="relative min-h-36 pr-12">
          <div aria-live="polite" aria-atomic="true">
            <div key={stepIndex} className="student-profile-tutorial-step">
              <p className="pt-1.5 text-xs leading-4 font-medium tracking-[0.08em] text-comelec-olive uppercase">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <h2
                id={titleId}
                className={`${registrationHeading} mt-2 text-4xl sm:text-[47px] sm:leading-[55px]`}
              >
                {step.title}
              </h2>
              <p
                id={descriptionId}
                className="mt-1.5 text-sm leading-[23px] text-comelec-olive sm:-me-9 sm:text-base"
              >
                {step.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close tutorial"
            onClick={close}
            className="absolute end-0 top-0 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-comelec-olive hover:bg-comelec-sage/35 hover:text-comelec-forest motion-safe:transition-colors motion-safe:duration-150"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>
        <Image
          key={step.image}
          src={`/registration/tutorial/${step.image}.webp`}
          alt={step.alt}
          width={600}
          height={480}
          unoptimized
          className="student-profile-tutorial-step mx-auto block h-auto w-full max-w-[600px]"
        />
        <footer className="mt-5 flex items-center justify-end gap-2 border-t border-comelec-sage pt-4">
          <button
            type="button"
            onClick={firstStep ? close : () => showStep(stepIndex - 1)}
            className={`${buttonStyle} min-w-20 hover:bg-comelec-sage/35`}
          >
            {!firstStep && <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />}
            {firstStep ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            onClick={lastStep ? close : () => showStep(stepIndex + 1)}
            className={`${buttonStyle} min-w-24 bg-comelec-forest text-comelec-cream hover:bg-comelec-forest-dark`}
          >
            {lastStep ? 'Done' : 'Next'}
            {!lastStep && <ArrowRight aria-hidden="true" className="size-4 shrink-0" />}
          </button>
        </footer>
      </dialog>
    </>
  )
}
