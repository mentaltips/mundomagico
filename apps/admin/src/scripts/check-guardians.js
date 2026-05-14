const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const children = await prisma.child.findMany({
    take: 5,
    include: {
      guardians: {
        include: { guardian: true }
      }
    }
  })
  console.log(JSON.stringify(children, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
