import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROLE_MIGRATION_MAP: Record<string, string> = {
  SCHOOL_ADMIN: 'ADMIN_ESCOLA',
  DIRECTOR: 'DIRETOR',
  COORDINATOR: 'COORDENADOR',
  TEACHER: 'PROFESSOR',
  MONITOR: 'MONITOR',
  CAREGIVER: 'CUIDADOR',
  GUARDIAN: 'RESPONSAVEL',
  FINANCE: 'FINANCEIRO',
  STAFF: 'FUNCIONARIO',
}

const STAFF_ROLETYPE_MAP: Record<string, string> = {
  TEACHER: 'PROFESSOR',
  MONITOR: 'MONITOR',
  CAREGIVER: 'CUIDADOR',
  COORDINATOR: 'COORDENADOR',
  ASSISTANT: 'AUXILIAR',
}

const ASSIGNMENT_TYPE_MAP: Record<string, string> = {
  MAIN_TEACHER: 'PROFESSOR_PRINCIPAL',
  ASSISTANT: 'AUXILIAR',
  MONITOR: 'MONITOR',
  CAREGIVER: 'CUIDADOR',
}

async function main() {
  console.log('🔄 Iniciando migração de cargos para português...')

  // 1. User.role
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } })
  let userUpdates = 0
  for (const user of users) {
    const newRole = ROLE_MIGRATION_MAP[user.role]
    if (newRole) {
      await prisma.user.update({ where: { id: user.id }, data: { role: newRole } })
      userUpdates++
    }
  }
  console.log(`✅ User.role: ${userUpdates} usuários atualizados`)

  // 2. Staff.roleType
  const staff = await prisma.staff.findMany({ select: { id: true, name: true, roleType: true } })
  let staffUpdates = 0
  for (const s of staff) {
    const newRoleType = STAFF_ROLETYPE_MAP[s.roleType]
    if (newRoleType) {
      await prisma.staff.update({ where: { id: s.id }, data: { roleType: newRoleType } })
      staffUpdates++
    }
  }
  console.log(`✅ Staff.roleType: ${staffUpdates} registros atualizados`)

  // 3. StaffGroupAssignment.assignmentType
  const assignments = await prisma.staffGroupAssignment.findMany({ select: { id: true, assignmentType: true } })
  let assignmentUpdates = 0
  for (const a of assignments) {
    const newType = ASSIGNMENT_TYPE_MAP[a.assignmentType]
    if (newType) {
      await prisma.staffGroupAssignment.update({ where: { id: a.id }, data: { assignmentType: newType } })
      assignmentUpdates++
    }
  }
  console.log(`✅ StaffGroupAssignment.assignmentType: ${assignmentUpdates} vínculos atualizados`)

  console.log('\n🎉 Migração concluída!')
}

main()
  .catch(e => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
