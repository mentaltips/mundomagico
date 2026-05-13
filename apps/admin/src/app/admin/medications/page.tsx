import { prisma } from '@mundo-magico/database'
import Link from 'next/link'
import { Plus, AlertTriangle, CheckCircle, Clock, Pill } from 'lucide-react'
import { format } from 'date-fns'
import { requireAuth } from '@/lib/auth'

export default async function MedicationsPage() {
  const user = await requireAuth()
  const medications = await prisma.medication.findMany({
    where: { schoolId: user.schoolId, active: true },
    include: {
      child: { select: { id: true, fullName: true, photoUrl: true, group: { select: { name: true } } } },
      administrations: {
        orderBy: { administeredAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { child: { fullName: 'asc' } },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Medicações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Controle rigoroso de medicação das crianças
          </p>
        </div>
        <Link href="/admin/medications/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova medicação
        </Link>
      </div>

      {/* Avisos de medicação pendente */}
      {medications.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <p className="font-semibold text-orange-800">Medicações aguardando administração hoje</p>
          </div>
          <div className="space-y-2">
            {medications.map((med) => {
              const lastAdmin = med.administrations[0]
              const adminToday = lastAdmin && new Date(lastAdmin.administeredAt) >= today
              return (
                <div key={med.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  adminToday ? 'bg-green-50 border-green-200' : 'bg-white border-orange-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {adminToday ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {med.child.fullName} — {med.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {med.dosage} · {med.frequency}
                        {adminToday && lastAdmin && (
                          <span className="text-green-600 ml-2">
                            ✓ Administrado às {format(new Date(lastAdmin.administeredAt), 'HH:mm')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!adminToday && (
                    <Link href={`/admin/medications/${med.id}/administer`} className="btn-primary text-xs px-3 py-1.5">
                      Administrar
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista completa */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="font-medium text-gray-700">Todas as medicações ativas ({medications.length})</p>
        </div>
        {medications.length === 0 ? (
          <div className="p-12 text-center">
            <Pill className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma medicação ativa</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {medications.map((med) => (
              <div key={med.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {med.child.photoUrl ? (
                    <img src={med.child.photoUrl} className="w-10 h-10 rounded-full object-cover" alt={med.child.fullName} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                      {med.child.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{med.child.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {med.name} — <span className="font-medium">{med.dosage}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {med.frequency} · {med.guardianAuthorization ? '✓ Autorizado' : '⚠️ Aguardando autorização'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/medications/${med.id}`} className="btn-ghost text-xs">
                    Detalhes
                  </Link>
                  <Link href={`/admin/medications/${med.id}/administer`} className="btn-primary text-xs px-3 py-1.5">
                    <Pill className="w-3.5 h-3.5" />
                    Administrar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
