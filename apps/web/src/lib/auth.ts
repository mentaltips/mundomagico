import { getServerSession, NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          })

          const data = await res.json()

          if (res.ok && data.user) {
            // Retornamos o usuário e também o token para ser usado depois se necessário
            return {
              ...data.user,
              accessToken: data.token,
            }
          }

          return null
        } catch (error) {
          console.error('[Auth] Login error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.schoolId = (user as any).schoolId
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
        ;(session as any).accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
