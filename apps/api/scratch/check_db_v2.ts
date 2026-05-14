import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const schoolIds = await prisma.child.groupBy({
    by: ['schoolId']
  })
  console.log(`Unique schoolIds in Child table:`, schoolIds)
  
  const allChildren = await prisma.child.findMany({
    take: 5,
    select: { id: true, fullName: true, schoolId: true }
  })
  console.log(`Some children:`, allChildren)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
