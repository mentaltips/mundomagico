import { getServerSession, NextAuthOptions } from 'next-auth'
import { getToken, decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import CredentialsProvider from 'next-auth/providers/credentials'
import { redirect } from 'next/navigation'

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
          // API_URL é server-only (sem NEXT_PUBLIC_) — preferido em produção
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

export async function getApiAuth(req?: any) {
  // 1. Tentar via getToken (o método oficial e mais seguro)
  if (req) {
    try {
      // Tentar pegar o token decodificado
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
      })
      
      if (token?.accessToken) {
        return {
          user: {
            id: token.sub as string,
            role: token.role as string,
            schoolId: token.schoolId as string,
            email: token.email as string,
          },
          token: token.accessToken as string,
        }
      }

    } catch (err) {
      console.error('[Auth] getToken error:', err)
    }
  }

  // 2. Fallback manual: ler os cookies diretamente
  try {
    const cookieStore = cookies()
    const sessionToken = 
      cookieStore.get('next-auth.session-token')?.value || 
      cookieStore.get('__Secure-next-auth.session-token')?.value ||
      cookieStore.get('authjs.session-token')?.value ||
      cookieStore.get('__Secure-authjs.session-token')?.value

    if (sessionToken && process.env.NEXTAUTH_SECRET) {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET,
      })

      if (decoded?.accessToken) {
        return {
          user: {
            id: decoded.sub as string,
            role: decoded.role as string,
            schoolId: decoded.schoolId as string,
            email: decoded.email as string,
          },
          token: decoded.accessToken as string,
        }
      }
    }
  } catch (err) {
    console.error('[Auth] Manual token retrieval error:', err)
  }

  // 3. Fallback final: getServerSession
  try {
    const session = await getServerSession(authOptions)
    if (session?.user) {
      return {
        user: session.user,
        token: (session as any).accessToken as string | undefined,
      }
    }
  } catch (err) {
    console.error('[Auth] getServerSession error:', err)
  }

  return null
}
