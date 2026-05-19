import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed oficial da Mundo Mágico...')

  // ─── Instituição Mundo Mágico ───
  const school = await prisma.school.upsert({
    where: { id: 'mundomagico-cajamar' },
    update: {},
    create: {
      id: 'mundomagico-cajamar',
      name: 'Mundo Mágico Brinquedoteca & Recreação',
      cnpj: '00.000.000/0001-00', // Substituir pelo real quando disponível
      phone: '(11) 97209-0986',
      email: 'contato@mundomagico.com.br',
      address: 'Cajamar, SP',
      city: 'Cajamar',
      state: 'SP',
      zipCode: '07750-000',
      institutionType: 'HIBRIDO', // Escola + Recreação
      activeModules: JSON.stringify(['DAILY_REPORT', 'CHECK_IN_OUT', 'MEDICATION', 'GALLERY', 'MESSAGES']),
      terminology: JSON.stringify({
        child: 'Criança',
        group: 'Turma',
        guardian: 'Responsável'
      }),
    },
  })
  console.log('✅ Instituição criada:', school.name)

  // ─── DIRETORIA (Betta) ───
  const adminPassword = await bcrypt.hash('magia2024', 10)
  const director = await prisma.user.upsert({
    where: { email: 'diretoria@mundomagico.com.br' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Diretora Betta',
      email: 'diretoria@mundomagico.com.br',
      password: adminPassword,
      role: 'ADMIN',
      phone: '(11) 97209-0986',
    },
  })
  console.log('✅ Diretora Betta criada:', director.email)

  // ─── EQUIPE (Professores e Monitores) ───
  const teacherPassword = await bcrypt.hash('equipe123', 10)
  const teacher1 = await prisma.user.upsert({
    where: { email: 'profa.fernanda@mundomagico.com.br' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Professora Fernanda',
      email: 'profa.fernanda@mundomagico.com.br',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })
  console.log('✅ Professora Fernanda criada')

  // ─── TURMAS / GRUPOS ───
  const grupos = await Promise.all([
    prisma.group.upsert({
      where: { id: 'turma-bercario' },
      update: {},
      create: {
        id: 'turma-bercario',
        schoolId: school.id,
        name: 'Berçário Encantado',
        shift: 'INTEGRAL',
        minAge: 4,
        maxAge: 12,
        capacity: 8,
        room: 'Sala 01 - Baby',
      },
    }),
    prisma.group.upsert({
      where: { id: 'turma-maternal' },
      update: {},
      create: {
        id: 'turma-maternal',
        schoolId: school.id,
        name: 'Maternal Descoberta',
        shift: 'INTEGRAL',
        minAge: 13,
        maxAge: 36,
        capacity: 15,
        room: 'Sala 02 - Kids',
      },
    }),
    prisma.group.upsert({
      where: { id: 'turma-recreacao' },
      update: {},
      create: {
        id: 'turma-recreacao',
        schoolId: school.id,
        name: 'Recreação & Lúdico',
        shift: 'INTEGRAL',
        minAge: 37,
        maxAge: 120,
        capacity: 20,
        room: 'Pátio de Brincadeiras',
      },
    }),
  ])
  console.log('✅', grupos.length, 'turmas criadas')

  // ─── CRIANÇAS E RESPONSÁVEIS (Teste Real) ───
  const exampleGuardian = await prisma.guardian.upsert({
    where: { id: 'resp-exemplo-1' },
    update: {},
    create: {
      id: 'resp-exemplo-1',
      school: { connect: { id: school.id } },
      fullName: 'Ana Paula Santos',
      phone: '(11) 98888-7777',
      email: 'ana.santos@email.com',
      relationship: 'Mãe',
      cpf: '123.456.789-00',
    },
  })

  const guardianUserPassword = await bcrypt.hash('familia123', 10)
  const guardianUser = await prisma.user.upsert({
    where: { email: 'ana.santos@email.com' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Ana Paula Santos',
      email: 'ana.santos@email.com',
      password: guardianUserPassword,
      role: 'RESPONSAVEL',
    },
  })

  await prisma.guardian.update({
    where: { id: 'resp-exemplo-1' },
    data: { userId: guardianUser.id }
  })

  const exampleChild = await prisma.child.upsert({
    where: { id: 'child-enzo' },
    update: {},
    create: {
      id: 'child-enzo',
      schoolId: school.id,
      groupId: 'turma-maternal',
      fullName: 'Enzo Gabriel Santos Lima',
      nickname: 'Enzo',
      birthDate: new Date('2022-05-10'),
      shift: 'INTEGRAL',
      status: 'ATIVO',
      usesDiapers: true,
      observations: 'Criança muito comunicativa e adora desenhar.',
    },
  })

  await prisma.childGuardian.upsert({
    where: { childId_guardianId: { childId: 'child-enzo', guardianId: 'resp-exemplo-1' } },
    update: {},
    create: {
      childId: 'child-enzo',
      guardianId: 'resp-exemplo-1',
      isPrimary: true,
    },
  })

  console.log('✅ Dados de teste vinculados com sucesso')
  console.log('\n🎉 Portal Mundo Mágico inicializado!')
  console.log('\n📋 Credenciais de Acesso:')
  console.log('   --- DIRETORIA (ADMIN) ---')
  console.log('   Email: diretoria@mundomagico.com.br / Senha: magia2024')
  console.log('   --- EQUIPE (TEACHER) ---')
  console.log('   Email: profa.fernanda@mundomagico.com.br / Senha: equipe123')
  console.log('   --- FAMÍLIA (GUARDIAN) ---')
  console.log('   Email: ana.santos@email.com / Senha: familia123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
