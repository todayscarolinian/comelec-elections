import Image from 'next/image'
import Link from 'next/link'

export function ElectionFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-section-inner landing-footer-inner">
        <div className="landing-footer-brand">
          <Image src="/landing/mark.webp" alt="" width={56} height={56} />
          <div>
            <p>SSC COMELEC</p>
            <small>Student council elections · 2026</small>
          </div>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#candidates">Candidates</a>
          <Link href="/register">Registration</Link>
          <a href="#voting">Ballot</a>
        </nav>
      </div>
    </footer>
  )
}
