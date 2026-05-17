import { requireAuth } from '@/lib/auth'
import { apiGet } from '@/lib/server-api'
import { ChildrenList } from './_components/ChildrenList'

export const dynamic = 'force-dynamic'

export default async function ChildrenPage() {
  const user = await requireAuth()

  const [children, groups] = await Promise.all([
    apiGet<any[]>('/api/children').catch(() => []),
    apiGet<any[]>('/api/groups?active=true').catch(() => []),
  ])

  return (
    <div className="page animate-in">
      <ChildrenList initialChildren={children} initialGroups={groups} />
    </div>
  )
}
