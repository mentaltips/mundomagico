import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const children = await prisma.child.count()
  const students = await prisma.student.count()
  const users = await prisma.user.count()
  const invoices = await prisma.invoice.count()
  
  console.log({ children, students, users, invoices })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
