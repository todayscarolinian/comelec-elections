import { createLucideIcon, Mail } from 'lucide-react'

const Facebook = createLucideIcon('Facebook', [
  ['path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', key: 'f' }],
])

const Instagram = createLucideIcon('Instagram', [
  ['rect', { x: 2, y: 2, width: 20, height: 20, rx: 5, key: 'body' }],
  ['circle', { cx: 12, cy: 12, r: 4, key: 'lens' }],
  ['path', { d: 'M17.5 6.5h.01', key: 'flash' }],
])

export const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const

export const contactLinks = [
  { href: 'https://web.facebook.com/usccomelec', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.instagram.com/uscssc.comelec/', label: 'Instagram', Icon: Instagram },
  { href: 'mailto:comelec.uscssc@gmail.com', label: 'Email', Icon: Mail },
] as const
