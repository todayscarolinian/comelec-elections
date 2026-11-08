import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    personId?: string
  }

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
    signedInAt: number
  }
}
