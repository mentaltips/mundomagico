import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    schoolId: string
  }

  interface Session {
    user: User
  }
}
