import { getServerSession, NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

function getApiBaseUrl() {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
  return apiUrl.replace(/\/$/, '').replace(/\/api$/, '')
}

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    if (!res.ok || !data.token) {
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    return {
      ...token,
      accessToken: data.token,
      refreshToken: data.refreshToken || token.refreshToken,
      accessTokenExpires: Date.now() + (data.expiresIn || 900) * 1000,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

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
          const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
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
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + (data.expiresIn || 900) * 1000,
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
        token.refreshToken = (user as any).refreshToken
        token.accessTokenExpires = (user as any).accessTokenExpires
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token
      }

      if (token.refreshToken) {
        return refreshAccessToken(token)
      }

      return { ...token, error: 'RefreshAccessTokenError' }
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
        ;(session as any).accessToken = token.accessToken
        ;(session as any).error = token.error
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
