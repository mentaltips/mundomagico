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

async function main() {
  console.log('🔄 Iniciando a migração de papéis de usuários de inglês para português...')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  })

  console.log(`📌 Encontrados ${users.length} usuários no total.`)

  let updatedCount = 0

  for (const user of users) {
    const oldRole = user.role
    const newRole = ROLE_MIGRATION_MAP[oldRole]

    if (newRole) {
      console.log(`✨ Atualizando usuário ${user.name} (${user.email}): ${oldRole} ➡️ ${newRole}`)
      await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole }
      })
      updatedCount++
    }
  }

  console.log(`\n🎉 Migração concluída com sucesso! ${updatedCount} usuários foram atualizados.`)
}

main()
  .catch(e => {
    console.error('❌ Erro na migração de cargos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
