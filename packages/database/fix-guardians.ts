import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.guardian.updateMany({
    where: { schoolId: null },
    data: { schoolId: 'mundomagico-cajamar' }
  })
  console.log('Guardians updated:', result.count)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
