import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const schoolId = 'mundo-magico-cajamar'
  const childrenCount = await prisma.child.count({
    where: { schoolId }
  })
  console.log(`Total children for ${schoolId}: ${childrenCount}`)
  
  const activeChildren = await prisma.child.findMany({
    where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] } },
    select: { id: true, fullName: true, status: true }
  })
  console.log(`Active children:`, activeChildren)

  const checkIns = await prisma.childCheckInOut.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log(`Latest check-ins:`, checkIns)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
