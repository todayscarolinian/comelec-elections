import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      personId: string
      email: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    personId: string
    email: string

    //Server-issued milliseconds: omitted from public session.
    signedInAt: number
  }
}
