/** A paragraph, or a bulleted list of short items. */
export type LegalBlock = string | { readonly items: readonly string[] }

export type LegalSection = {
  /** Anchor id; lowercase words joined by hyphens. Never rename once published, links may use it. */
  readonly id: string
  readonly heading: string
  readonly body: readonly LegalBlock[]
}

export type LegalDocument = {
  readonly title: string
  /** Shown as a draft banner until the commission approves the wording. */
  readonly status: 'draft' | 'final'
  readonly version: string
  /** ISO date (YYYY-MM-DD) of the last wording change. */
  readonly lastUpdated: string
  readonly summary: string
  readonly sections: readonly LegalSection[]
  readonly related: { readonly href: `/${string}`; readonly label: string }
}

/**
 * Where privacy and terms questions go. Null until the commission confirms an address; the pages
 * then point people to the commission's official channels instead.
 */
export const LEGAL_CONTACT_EMAIL: string | null = null

export function contactInstruction(email: string | null = LEGAL_CONTACT_EMAIL): string {
  return email
    ? `Email the SSC COMELEC at ${email}.`
    : 'Message the SSC COMELEC through its official student council channels.'
}
