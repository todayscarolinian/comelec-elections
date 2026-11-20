import Image from 'next/image'
import { ELECTION, type ElectionDef } from '@/election'

const election: ElectionDef = ELECTION

export function CandidateGallery() {
  return (
    <section id="candidates" className="landing-gallery" aria-labelledby="candidate-heading">
      <div className="landing-section-inner">
        <div className="landing-gallery-intro">
          <h2 id="candidate-heading">
            Meet your
            <br /> next council.
          </h2>
          <p>
            Explore the candidate profiles before you vote.
            {election.title === 'Placeholder Election' &&
              ' Sample profiles are shown while the official slate is being prepared.'}
          </p>
        </div>
        <div className="landing-questions">
          {election.questions.map((question) => (
            <section key={question.id} aria-labelledby={`question-${question.id}`}>
              <div className="landing-question-heading">
                <h3 id={`question-${question.id}`}>{question.title}</h3>
                <span>
                  {question.candidates.length}{' '}
                  {question.candidates.length === 1 ? 'candidate' : 'candidates'}
                </span>
              </div>
              <ul className="landing-candidates">
                {question.candidates.map((candidate) => (
                  <li key={candidate.id} className="landing-candidate">
                    <Image
                      src={candidate.photo}
                      alt=""
                      width={304}
                      height={304}
                      sizes="(max-width: 38rem) 50vw, 25vw"
                      className="landing-portrait"
                    />
                    <h4>{candidate.name}</h4>
                    <p className="landing-party" data-party={candidate.party}>
                      {candidate.party ?? 'Independent'}
                    </p>
                    <details className="landing-profile">
                      <summary>
                        View profile<span className="landing-sr-only"> for {candidate.name}</span>
                      </summary>
                      <p>{candidate.bio}</p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
