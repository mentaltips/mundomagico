import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (token) {
      const role = token.role as string

      // Admin, Admin Escola & Diretor -> /admin
      if (path.startsWith('/admin') && !['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role)) {
        return NextResponse.redirect(new URL(role === 'RESPONSAVEL' ? '/responsavel' : '/professor', req.url))
      }

      // Professor, Monitor & Cuidador -> /professor
      if (path.startsWith('/professor') && !['PROFESSOR', 'MONITOR', 'CUIDADOR'].includes(role)) {
        return NextResponse.redirect(new URL(['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role) ? '/admin' : '/responsavel', req.url))
      }

      // Responsável -> /responsavel
      if (path.startsWith('/responsavel') && role !== 'RESPONSAVEL') {
        return NextResponse.redirect(new URL(['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role) ? '/admin' : '/professor', req.url))
      }

      // Impedir acesso direto ao legado /parent e /teacher redirigindo adequadamente preservando o subcaminho
      if (path.startsWith('/parent')) {
        const newPath = path.replace('/parent', '/responsavel')
        return NextResponse.redirect(new URL(newPath, req.url))
      }
      if (path.startsWith('/teacher')) {
        const newPath = path.replace('/teacher', '/professor')
        return NextResponse.redirect(new URL(newPath, req.url))
      }

      // Root redirect based on role
      if (path === '/') {
        if (['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role)) return NextResponse.redirect(new URL('/admin', req.url))
        if (['PROFESSOR', 'MONITOR', 'CUIDADOR'].includes(role)) return NextResponse.redirect(new URL('/professor', req.url))
        if (role === 'RESPONSAVEL') return NextResponse.redirect(new URL('/responsavel', req.url))
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
     * - /api/* (rotas internas/proxy validam auth no handler/backend)
     * - /_next/* (arquivos estáticos do Next.js)
     * - /favicon, imagens, etc.
     */
    '/((?!login|privacy-policy|api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
