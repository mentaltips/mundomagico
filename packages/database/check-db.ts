import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  const count = await prisma.invoice.count()
  console.log('Invoice count:', count)
  
  const invoices = await prisma.invoice.findMany()
  console.log('Invoices:', JSON.stringify(invoices, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
