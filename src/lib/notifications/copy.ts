import type { NotificationType } from '@/generated/prisma/enums'

type NotificationData = { rejectionReason?: string; held?: boolean } | null

export type NotificationCopy = { title: string; body: string; href: string }

const COPY: Record<NotificationType, (data: NotificationData) => NotificationCopy> = {
  REGISTRATION_APPROVED: () => ({
    title: 'Registration approved',
    body: 'You are a Voter. Cast your Ballot while voting is open.',
    href: '/ballot',
  }),
  REGISTRATION_REJECTED: (data) => ({
    title: 'Registration needs changes',
    body: data?.rejectionReason
      ? `Reason: ${data.rejectionReason}. You can update and resubmit.`
      : 'You can update and resubmit your registration.',
    href: '/register',
  }),
  BALLOT_RECORDED: (data) =>
    data?.held
      ? {
          title: 'Ballot recorded (held)',
          body: 'It will count once your registration is approved.',
          href: '/ballot',
        }
      : { title: 'Ballot recorded', body: 'Thank you for voting.', href: '/ballot' },
  REGISTRATION_OPENED: () => ({
    title: 'Registration is open',
    body: 'Register now to vote in the SSC election.',
    href: '/register',
  }),
  REGISTRATION_CLOSED: () => ({
    title: 'Registration has closed',
    body: 'See the election calendar for what comes next.',
    href: '/#calendar',
  }),
  VOTING_OPENED: () => ({
    title: 'Voting is open',
    body: 'Cast your Ballot before voting closes.',
    href: '/ballot',
  }),
  VOTING_CLOSED: () => ({
    title: 'Voting has closed',
    body: 'Thank you to everyone who voted. Results follow soon.',
    href: '/results',
  }),
  RESULTS_RELEASED: () => ({
    title: 'Results are out',
    body: 'See the official SSC election results.',
    href: '/results',
  }),
}

export function notificationCopy(type: NotificationType, data: NotificationData) {
  return COPY[type](data)
}
