const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const child = await prisma.child.findFirst()
  if (!child) { console.log('No child found'); return }

  const invoice = await prisma.invoice.create({
    data: {
      schoolId: 'mundomagico-cajamar',
      childId: child.id,
      description: 'Teste Manual',
      amount: 100.0,
      dueDate: new Date(),
      status: 'PENDENTE'
    }
  })
  console.log('Created Invoice:', invoice)
}

main().catch(console.error).finally(() => prisma.$disconnect())
