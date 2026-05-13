const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.invoice.count()
  const last = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } })
  console.log('Total Invoices:', count)
  console.log('Last Invoice:', last)
}

main().catch(console.error).finally(() => prisma.$disconnect())
