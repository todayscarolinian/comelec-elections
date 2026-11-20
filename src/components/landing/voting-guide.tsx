import Link from 'next/link'

export function VotingGuide() {
  return (
    <section id="voting" className="landing-guide" aria-labelledby="guide-heading">
      <div className="landing-section-inner">
        <div className="landing-guide-heading">
          <h2 id="guide-heading">Before you vote.</h2>
          <Link href="/register">
            Check registration status <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <ol className="landing-steps">
          <li>
            <h3>Register</h3>
            <p>
              Sign in with your organization Google account, upload your Student Profile, and select
              your Year Level.
            </p>
          </li>
          <li>
            <h3>Check your status</h3>
            <p>
              If your registration is pending or rejected, you can cast a Held Ballot while voting
              is open. It counts once your registration is approved.
            </p>
          </li>
          <li>
            <h3>Review &amp; vote</h3>
            <p>
              Review your choices before submitting. Your ballot is final. Online ballot submission
              is currently unavailable here.
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
