import { prisma } from '@mundo-magico/database'

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, schoolId: true, role: true }
  })
  console.log('Users:', JSON.stringify(users, null, 2))
}

check().catch(console.error)
