import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      schoolId: string
    } & DefaultSession['user']
    accessToken?: string
    error?: string
  }

  interface User {
    role: string
    schoolId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    schoolId: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
