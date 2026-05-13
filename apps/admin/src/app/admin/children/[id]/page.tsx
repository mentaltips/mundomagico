import { ChildForm } from '../_components/ChildForm'
import { prisma } from '@mundo-magico/database'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function EditChildPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const [child, groups] = await Promise.all([
    prisma.child.findUnique({
      where: { id: params.id, schoolId: user.schoolId },
      include: {
        guardians: { include: { guardian: true } },
      }
    }),
    prisma.group.findMany({ where: { schoolId: user.schoolId, active: true }, orderBy: { name: 'asc' } })
  ])

  if (!child) {
    notFound()
  }

  // We need to pass the child data in a way that ChildForm expects
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="page-title">Editar Aluno: {child.fullName}</h1>
        <p className="text-sm text-gray-500 mt-1">Atualize as informações do aluno e de seus responsáveis</p>
      </div>
      <ChildForm 
        groups={groups} 
        defaultValues={{
          fullName: child.fullName,
          nickname: child.nickname || undefined,
          birthDate: child.birthDate.toISOString().split('T')[0],
          gender: child.gender || undefined,
          photoUrl: child.photoUrl || undefined,
          registrationNumber: child.registrationNumber || undefined,
          groupId: child.groupId || undefined,
          shift: child.shift as any,
          contractedHours: child.contractedHours || undefined,
          entryDate: child.entryDate ? child.entryDate.toISOString().split('T')[0] : undefined,
          status: child.status as any,
          bloodType: child.bloodType || undefined,
          allergies: child.allergies ? JSON.parse(child.allergies).join('\n') : '',
          continuousMeds: child.continuousMeds ? JSON.parse(child.continuousMeds).join('\n') : '',
          dietaryRestrictions: child.dietaryRestrictions ? JSON.parse(child.dietaryRestrictions).join('\n') : '',
          healthObservations: child.healthObservations || undefined,
          usesDiapers: child.usesDiapers,
          usesBottle: child.usesBottle,
          usesNipple: child.usesNipple,
          specialSleep: child.specialSleep || undefined,
          observations: child.observations || undefined,
          imageAuthorized: child.imageAuthorized,
        }} 
        childId={child.id} 
      />
    </div>
  )
}
