import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (token) {
      const role = token.role as string

      // Admin & Director -> /admin
      if (path.startsWith('/admin') && !['ADMIN', 'DIRECTOR'].includes(role)) {
        return NextResponse.redirect(new URL(role === 'GUARDIAN' ? '/parent' : '/teacher', req.url))
      }

      // Teacher & Caregiver -> /teacher
      if (path.startsWith('/teacher') && !['TEACHER', 'CAREGIVER'].includes(role)) {
        return NextResponse.redirect(new URL(['ADMIN', 'DIRECTOR'].includes(role) ? '/admin' : '/parent', req.url))
      }

      // Parent (Guardian) -> /parent
      if (path.startsWith('/parent') && role !== 'GUARDIAN') {
        return NextResponse.redirect(new URL(['ADMIN', 'DIRECTOR'].includes(role) ? '/admin' : '/teacher', req.url))
      }

      // Root redirect based on role
      if (path === '/') {
        if (['ADMIN', 'DIRECTOR'].includes(role)) return NextResponse.redirect(new URL('/admin', req.url))
        if (['TEACHER', 'CAREGIVER'].includes(role)) return NextResponse.redirect(new URL('/teacher', req.url))
        if (role === 'GUARDIAN') return NextResponse.redirect(new URL('/parent', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Protege todas as rotas EXCETO:
     * - /login (página de login)
     * - /api/auth/* (rotas internas do NextAuth - NUNCA proteger)
     * - /_next/* (arquivos estáticos do Next.js)
     * - /favicon, imagens, etc.
     */
    '/((?!login|privacy-policy|api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
