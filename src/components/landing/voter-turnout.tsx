import Link from 'next/link'

export function VoterTurnout() {
  return (
    <section id="turnout" className="landing-turnout" aria-labelledby="turnout-heading">
      <div className="landing-section-inner">
        <h2 id="turnout-heading">Voter turnout</h2>
        <div className="landing-turnout-display">
          <span className="landing-turnout-number" aria-hidden="true">
            —
          </span>
          <p>Live turnout is unavailable.</p>
        </div>
        <div className="landing-turnout-bottom">
          <p>Results are published after the Commission completes its audit.</p>
          <Link className="landing-button landing-inverse-button" href="/register">
            Check registration <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
