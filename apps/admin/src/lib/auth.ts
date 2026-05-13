import { getServerSession, NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { redirect } from 'next/navigation'

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
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          })

          const data = await res.json()

          if (res.ok && data.user) {
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
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session.user
}

export async function getApiAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }
  
  return session.user
}
