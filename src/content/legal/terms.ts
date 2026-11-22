import { contactInstruction, type LegalDocument } from './types'

// Draft for commission review.
export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  status: 'final',
  version: '1.0',
  lastUpdated: '2026-11-21',
  summary:
    'The rules for registering and voting in the SSC Elections on this site. By signing in, registering or voting, you agree to them.',
  related: { href: '/privacy', label: 'Privacy Policy' },
  sections: [
    {
      id: 'about-these-terms',
      heading: 'About these terms',
      body: [
        'This site is run by the SSC Commission on Elections (SSC COMELEC) to hold the 2026 SSC Elections. These terms apply alongside the SSC election rules. Where the two conflict, the election rules apply.',
      ],
    },
    {
      id: 'who-can-take-part',
      heading: 'Who can take part',
      body: [
        {
          items: [
            'Anyone can view the candidates, the election calendar, the Turnout count, and the Results once they are released.',
            'To register or vote, you must sign in with your own USC Google account with a verified email address.',
            'Only Ballots from people whose Registration is approved by the commission are counted.',
          ],
        },
      ],
    },
    {
      id: 'registration',
      heading: 'Registering to vote',
      body: [
        {
          items: [
            'Upload a genuine, unedited screenshot of your own Student Profile and declare your correct Year Level.',
            'The commission reviews every Registration. It may correct your Year Level to match your Student Profile, or reject a Registration and give a reason.',
            'If your Registration is rejected, you can fix it and resubmit while Registration or voting is open, but not after voting closes.',
            'Submitting a fake, edited or someone else’s Student Profile will get your Registration rejected and may be referred to the commission for further action.',
          ],
        },
      ],
    },
    {
      id: 'voting',
      heading: 'Voting',
      body: [
        {
          items: [
            'You can cast one Ballot, and only while the Election is open. Voting hours may be extended by the commission.',
            'You must answer every question, either by choosing candidates up to the limit shown or by abstaining.',
            'A Ballot is final once cast. It cannot be changed or withdrawn.',
            'If your Registration is not yet approved when you vote, your Ballot is held. It counts only if the commission approves your Registration. If your Registration is rejected and you do not fix it before voting closes, your Ballot will not count.',
          ],
        },
      ],
    },
    {
      id: 'ballot-visibility',
      heading: 'Your Ballot is not anonymous to the commission',
      body: [
        'Your choices are recorded under your name so the election can be audited. The commission (Audit Commissioner, Chair and COMELEC at-large) can view them, and every view is logged. Candidates and other voters cannot. You will be asked to acknowledge this before you vote. See the Privacy Policy for details.',
      ],
    },
    {
      id: 'results',
      heading: 'Turnout and Results',
      body: [
        'Anyone can see how many Ballots have been cast. Per-candidate counts stay hidden until the commission releases the Results, which happens only after voting closes and every held Ballot’s Registration has been reviewed. Once released, Results cannot be withdrawn through this site.',
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Acceptable use',
      body: [
        'You agree not to:',
        {
          items: [
            'Sign in, register or vote as anyone else, or let anyone else use your account.',
            'Try to vote more than once, or to access information you are not allowed to see.',
            'Use scripts, bots or other automated tools on the site.',
            'Interfere with the site, its security or other people’s use of it.',
            'Pressure, pay or otherwise influence someone to vote a certain way through this site.',
          ],
        },
        'If you find a security problem or a bug, report it to the commission instead of exploiting it.',
      ],
    },
    {
      id: 'commission-decisions',
      heading: 'The commission’s decisions',
      body: [
        'The commission decides on Registrations, opens and closes Registration and voting, and releases the Results. Disputes are handled under the SSC election rules.',
      ],
    },
    {
      id: 'availability',
      heading: 'Availability',
      body: [
        'We work to keep the site running throughout the Election, but we cannot promise it will always be available or free of errors. If a technical problem affects voting, the commission decides what to do, for example by extending voting hours.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to these terms',
      body: [
        'If we change these terms, we will update the date at the top of this page and announce important changes through the SSC COMELEC’s official channels.',
      ],
    },
    {
      id: 'contact',
      heading: 'Contact us',
      body: [`For questions about these terms: ${contactInstruction()}`],
    },
  ],
}
