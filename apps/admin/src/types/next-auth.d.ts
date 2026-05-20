import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    schoolId: string
  }

  interface Session {
    user: User
    accessToken?: string
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    schoolId?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
