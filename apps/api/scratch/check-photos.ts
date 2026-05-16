import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const photos = await prisma.childPhoto.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('Recent Photos:', JSON.stringify(photos, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
