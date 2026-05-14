import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const id = 'cmp1wfq9h001812qkiu491a6c'
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      child: true,
      student: true
    }
  })
  console.log(JSON.stringify(invoice, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
