import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../lib/auth'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string

  if (['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR'].includes(role)) {
    redirect('/admin')
  }

  if (['PROFESSOR', 'MONITOR', 'CUIDADOR'].includes(role)) {
    redirect('/professor')
  }

  if (role === 'RESPONSAVEL') {
    redirect('/responsavel')
  }

  redirect('/login')
}
