// Triggering reload to generate client in custom packages/database/src/generated/client path
import 'dotenv/config'
import app from './app'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'
import path from 'path'

const PORT = process.env.PORT || 3333

async function synchronizeDatabase() {
  if (process.env.NODE_ENV === 'production') return

  try {
    console.log('🔄 Running db push inside packages/database...')
    const dbPath = path.resolve(__dirname, '../../../packages/database')
    console.log('📂 dbPath is:', dbPath)
    
    const pushOutput = execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: dbPath,
      encoding: 'utf-8',
    })
    console.log('✅ Prisma db push output:\n', pushOutput)
  } catch (err: any) {
    console.error('❌ Error synchronizing database:')
    console.error('Message:', err.message)
    console.error('Stdout:', err.stdout)
    console.error('Stderr:', err.stderr)
  }
}

async function ensureSeedData() {
  if (process.env.NODE_ENV === 'production') return

  try {
    console.log('🌱 Checking / Seeding default database entities...')
    
    // 1. School
    const school = await prisma.school.upsert({
      where: { id: 'mundomagico-cajamar' },
      update: {},
      create: {
        id: 'mundomagico-cajamar',
        name: 'Mundo Mágico Brinquedoteca & Recreação',
        cnpj: '00.000.000/0001-00',
        phone: '(11) 97209-0986',
        email: 'contato@mundomagico.com.br',
        address: 'Cajamar, SP',
        city: 'Cajamar',
        state: 'SP',
        zipCode: '07750-000',
        institutionType: 'HIBRIDO',
        activeModules: JSON.stringify(['DAILY_REPORT', 'CHECK_IN_OUT', 'MEDICATION', 'GALLERY', 'MESSAGES']),
        terminology: JSON.stringify({
          child: 'Criança',
          group: 'Turma',
          guardian: 'Responsável'
        }),
      },
    })

    // 2. Admin (Betta)
    const adminPassword = await bcrypt.hash('magia2024', 10)
    await prisma.user.upsert({
      where: { email: 'diretoria@mundomagico.com.br' },
      update: {
        active: true,
        password: adminPassword,
      },
      create: {
        schoolId: school.id,
        name: 'Diretora Betta',
        email: 'diretoria@mundomagico.com.br',
        password: adminPassword,
        role: 'ADMIN',
        phone: '(11) 97209-0986',
      },
    })

    // 3. Teacher
    const teacherPassword = await bcrypt.hash('equipe123', 10)
    await prisma.user.upsert({
      where: { email: 'profa.fernanda@mundomagico.com.br' },
      update: { active: true, password: teacherPassword },
      create: {
        schoolId: school.id,
        name: 'Professora Fernanda',
        email: 'profa.fernanda@mundomagico.com.br',
        password: teacherPassword,
        role: 'TEACHER',
      },
    })

    // 4. Groups
    await prisma.group.upsert({
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
    })

    await prisma.group.upsert({
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
    })

    await prisma.group.upsert({
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
    })

    // 5. Guardian
    const guardianUserPassword = await bcrypt.hash('familia123', 10)
    const guardianUser = await prisma.user.upsert({
      where: { email: 'ana.santos@email.com' },
      update: { active: true, password: guardianUserPassword },
      create: {
        schoolId: school.id,
        name: 'Ana Paula Santos',
        email: 'ana.santos@email.com',
        password: guardianUserPassword,
        role: 'RESPONSAVEL',
      },
    })

    await prisma.guardian.upsert({
      where: { id: 'resp-exemplo-1' },
      update: { userId: guardianUser.id },
      create: {
        id: 'resp-exemplo-1',
        schoolId: school.id,
        userId: guardianUser.id,
        fullName: 'Ana Paula Santos',
        phone: '(11) 98888-7777',
        email: 'ana.santos@email.com',
        relationship: 'Mãe',
        cpf: '123.456.789-00',
      },
    })

    // 6. Child (Enzo)
    await prisma.child.upsert({
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

    console.log('✅ Database seeded and verified successfully!')
  } catch (err) {
    console.error('❌ Error during ensureSeedData:', err)
  }
}

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`)
  await synchronizeDatabase()
  await ensureSeedData()
})

