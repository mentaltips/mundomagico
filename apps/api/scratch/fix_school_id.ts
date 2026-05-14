import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const from = 'mundomagico-cajamar'
  const to = 'mundo-magico-cajamar'
  
  const updatedChildren = await prisma.child.updateMany({
    where: { schoolId: from },
    data: { schoolId: to }
  })
  console.log(`Updated ${updatedChildren.count} children from ${from} to ${to}`)
  
  const updatedCheckIns = await prisma.childCheckInOut.updateMany({
    where: { schoolId: from },
    data: { schoolId: to }
  })
  console.log(`Updated ${updatedCheckIns.count} check-ins from ${from} to ${to}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
