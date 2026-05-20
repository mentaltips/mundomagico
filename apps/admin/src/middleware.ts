import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (token) {
      const role = String(token.role || '').toUpperCase()

      const isAdmin = ['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role)
      const isProf = ['PROFESSOR', 'MONITOR', 'CUIDADOR'].includes(role)
      const isResp = role === 'RESPONSAVEL'

      // Admin, Admin Escola & Diretor -> /admin
      if (path.startsWith('/admin') && !isAdmin) {
        if (isProf) return NextResponse.redirect(new URL('/professor', req.url))
        if (isResp) return NextResponse.redirect(new URL('/responsavel', req.url))
        return NextResponse.redirect(new URL('/login?error=AcessoNegado', req.url))
      }

      // Professor, Monitor & Cuidador -> /professor
      if (path.startsWith('/professor') && !isProf) {
        if (isAdmin) return NextResponse.redirect(new URL('/admin', req.url))
        if (isResp) return NextResponse.redirect(new URL('/responsavel', req.url))
        return NextResponse.redirect(new URL('/login?error=AcessoNegado', req.url))
      }

      // Responsável -> /responsavel
      if (path.startsWith('/responsavel') && !isResp) {
        if (isAdmin) return NextResponse.redirect(new URL('/admin', req.url))
        if (isProf) return NextResponse.redirect(new URL('/professor', req.url))
        return NextResponse.redirect(new URL('/login?error=AcessoNegado', req.url))
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
        if (isAdmin) return NextResponse.redirect(new URL('/admin', req.url))
        if (isProf) return NextResponse.redirect(new URL('/professor', req.url))
        if (isResp) return NextResponse.redirect(new URL('/responsavel', req.url))
        return NextResponse.redirect(new URL('/login?error=AcessoNegado', req.url))
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
