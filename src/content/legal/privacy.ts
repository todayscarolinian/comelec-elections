import { contactInstruction, type LegalDocument } from './types'

// Draft for commission review. Retention periods are a proposal awaiting the client's decision
// (see docs/software-design.md §14 and docs/sprint-plan.md).
export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  status: 'draft',
  version: '0.1',
  lastUpdated: '2026-11-21',
  summary:
    'How the SSC COMELEC collects, uses, shares and keeps your personal information when you register and vote in the SSC Elections.',
  related: { href: '/terms', label: 'Terms of Service' },
  sections: [
    {
      id: 'who-we-are',
      heading: 'Who we are',
      body: [
        'The SSC Commission on Elections (SSC COMELEC) runs this site to hold the 2026 SSC Elections. The SSC COMELEC decides how your personal information is used and is responsible for it.',
        'We handle personal information in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and the rules of the National Privacy Commission.',
      ],
    },
    {
      id: 'information-we-collect',
      heading: 'Information we collect',
      body: [
        'When you sign in with your organization Google account, we receive and keep:',
        {
          items: [
            'Your name and email address.',
            'Confirmation from Google that the account belongs to the organization and that the email address is verified. We do not keep your Google password or other Google account data.',
          ],
        },
        'When you register to vote, we collect:',
        {
          items: [
            'The Year Level you declare.',
            'The screenshot of your Student Profile that you upload. It shows your name, student ID, Year Level and current term, and may also show your date of birth.',
            'Four details our system reads from the screenshot (name, student ID, Year Level and term) and whether each one matches your account. We do not keep the rest of the text in the image.',
            'The status of your Registration, any reason it was rejected, and which commission member reviewed it and when.',
          ],
        },
        'When you vote, we record:',
        {
          items: [
            'Your choices and abstentions on each question, saved under your name.',
            'Your Year Level at the time you voted, when you voted, and when you acknowledged the ballot disclosure.',
          ],
        },
        'We also keep a log of what commission members do in the admin area, such as reviewing Registrations and viewing or exporting Ballots.',
      ],
    },
    {
      id: 'how-we-use-it',
      heading: 'How we use your information',
      body: [
        {
          items: [
            'To check that you are a member of the organization and eligible to vote.',
            'To review your Registration. Our system reads your Student Profile on our own server to help reviewers, but a commission member makes every decision.',
            'To make sure each person casts only one Ballot, and to count only Ballots from approved Registrations.',
            'To audit the election and resolve disputes about the Results.',
            'To show the public how many Ballots have been cast, and the Results once released. These are totals only and never name anyone.',
          ],
        },
        'We do not use your information for advertising, sell it, or use it for anything unrelated to the election.',
      ],
    },
    {
      id: 'legal-basis',
      heading: 'Why we are allowed to use it',
      body: [
        'We process your information with your consent, which you give when you submit your Registration and when you acknowledge the ballot disclosure before voting. We also rely on the legitimate interest of the student council in running a fair and verifiable election.',
        'Your date of birth and the way you vote can count as sensitive personal information. We collect them only because they are part of the Student Profile and the Ballot, and we protect them as described below.',
      ],
    },
    {
      id: 'who-can-see-it',
      heading: 'Who can see your information',
      body: [
        {
          items: [
            'The election commission (Audit Commissioner, Chair and COMELEC at-large) can see Registrations, Student Profile images and Ballots, including how each person voted. This is how the election is audited. Every time the commission views or exports Ballots, it is logged.',
            'The technical team that builds and runs this site has access to the database to keep it working, under a waiver agreed with the commission.',
            'Candidates and other voters cannot see your Registration or your Ballot.',
          ],
        },
        'We use these service providers, which store or process information on our behalf:',
        {
          items: [
            'Google, for signing in.',
            'Supabase, for the database and for storing Student Profile images in a private storage bucket.',
            'Vercel, for hosting the site. Like most hosts, it may keep standard request logs, such as IP addresses and browser details, for security.',
          ],
        },
        'We share information with anyone else only if the law requires it.',
      ],
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: [
        'We use only the cookies needed to sign you in and protect your session. The session cookie is encrypted, cannot be read by scripts on the page, and expires after 8 hours. We do not use analytics or advertising cookies.',
      ],
    },
    {
      id: 'how-we-protect-it',
      heading: 'How we protect your information',
      body: [
        {
          items: [
            'Only organization accounts with a verified email address can sign in.',
            'Student Profile images are stored in a private bucket and opened only through short-lived links given to commission members.',
            'The database blocks direct public access, and every admin action is checked against the commission list each time.',
            'Viewing and exporting Ballots is logged so the commission can hold its own members accountable.',
          ],
        },
      ],
    },
    {
      id: 'retention',
      heading: 'How long we keep it',
      body: [
        'Proposed periods, awaiting confirmation by the commission. Each is counted from the day the Results are released:',
        {
          items: [
            'Student Profile images: deleted after 30 days.',
            'Registration details (Year Level, the four checked details, status and review notes): deleted after 1 year.',
            'Ballots and the admin activity log: deleted after 1 year, so a contested result can still be audited.',
            'Your name and email address: deleted together with your Registration and Ballot.',
            'Published totals (Turnout and Results), which do not identify anyone: kept as a public record.',
          ],
        },
      ],
    },
    {
      id: 'your-rights',
      heading: 'Your rights',
      body: [
        'Under the Data Privacy Act, you have the right to:',
        {
          items: [
            'Be told how your information is used, which is what this policy is for.',
            'Get a copy of the information we hold about you.',
            'Have inaccurate information corrected.',
            'Object to processing, or ask us to delete or block your information.',
            'File a complaint with the National Privacy Commission.',
          ],
        },
        'Some requests have limits. A cast Ballot cannot be changed, and we may need to keep a Ballot until the audit period ends so the election can be verified.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      body: [
        'If we change this policy, we will update the date at the top of this page. For important changes, we will also announce them through the SSC COMELEC’s official channels.',
      ],
    },
    {
      id: 'contact',
      heading: 'Contact us',
      body: [
        `For questions about this policy or to make a request about your information: ${contactInstruction()}`,
      ],
    },
  ],
}
