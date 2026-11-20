import Image from 'next/image'
import Link from 'next/link'
import { ElectionStatus } from './election-status'

export function ElectionHero() {
  return (
    <section className="landing-hero" aria-labelledby="election-title">
      <div className="landing-hero-inner">
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#home" aria-label="SSC COMELEC home">
            <Image src="/landing/mark.webp" alt="" width={36} height={36} />
          </a>
          <ul>
            <li>
              <a href="#home" aria-current="page">
                Home
              </a>
            </li>
            <li>
              <a href="#candidates">Candidates</a>
            </li>
          </ul>
          <a className="landing-nav-dates" href="#calendar">
            Dates
          </a>
        </nav>
        <div className="landing-hero-content">
          <div className="landing-hero-copy">
            <ElectionStatus />
            <p>
              Cast one Ballot online on November 20. Anyone can follow Turnout. The Commission
              releases the Results after the audit.
            </p>
            <Link className="landing-button" href="/register">
              Check registration <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="landing-hero-artwork">
            <Image
              className="landing-motif-one"
              src="/landing/motif.webp"
              alt=""
              width={240}
              height={194}
            />
            <Image
              className="landing-motif-two"
              src="/landing/motif.webp"
              alt=""
              width={240}
              height={194}
            />
            <h1 id="election-title" className="landing-hero-title">
              <span className="landing-ssc">SSC</span>{' '}
              <span className="landing-elections">Elections</span>{' '}
              <span className="landing-year">’26</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}
