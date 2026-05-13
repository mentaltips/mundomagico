import { prisma } from '@mundo-magico/database'
import { notFound } from 'next/navigation'
import { DailyRoutineForm } from '../_components/DailyRoutineForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ChildDailyRoutinePage({
  params,
  searchParams,
}: {
  params: { childId: string }
  searchParams: { date?: string }
}) {
  const today = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')
  const date = new Date(today + 'T00:00:00')

  const child = await prisma.child.findUnique({
    where: { id: params.childId },
    include: {
      group: true,
      guardians: {
        include: { guardian: true },
        where: { receiveNotif: true },
      },
      dailyReports: {
        where: { date },
        include: { meals: true, sleep: true, hygiene: true, health: true, moods: true, activities: true },
      },
    },
  })

  if (!child) notFound()

  const existingReport = child.dailyReports[0] ?? null

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/daily-routine" className="flex items-center gap-1 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Rotina Diária
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{child.fullName}</span>
      </div>

      {/* Header da criança */}
      <div className="card p-5 flex items-center gap-4">
        {child.photoUrl ? (
          <img src={child.photoUrl} className="w-16 h-16 rounded-full object-cover" alt={child.fullName} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold">
            {child.fullName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{child.fullName}</h1>
          <p className="text-sm text-gray-500">
            {child.group?.name ?? 'Sem grupo'} · {
              format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
            }
          </p>
          {(child.allergies || child.dietaryRestrictions) && (
            <div className="flex gap-2 mt-1 flex-wrap">
              {child.allergies && (
                <span className="badge bg-red-100 text-red-700 text-xs">
                  ⚠️ Alergias: {JSON.parse(child.allergies).join(', ')}
                </span>
              )}
              {child.dietaryRestrictions && (
                <span className="badge bg-orange-100 text-orange-700 text-xs">
                  🚫 Restrições: {JSON.parse(child.dietaryRestrictions).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <DailyRoutineForm
        childId={child.id}
        date={today}
        usesDiapers={child.usesDiapers}
        usesBottle={child.usesBottle}
        existingReport={existingReport}
        guardians={child.guardians.map((cg) => ({
          id: cg.guardian.id,
          name: cg.guardian.fullName,
          phone: cg.guardian.phone,
        }))}
      />
    </div>
  )
}
