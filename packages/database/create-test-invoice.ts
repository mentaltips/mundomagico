import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const child = await prisma.child.findFirst()
  if (!child) {
    console.log('No children found to link invoice.')
    return
  }

  const invoice = await prisma.invoice.create({
    data: {
      schoolId: 'mundomagico-cajamar',
      childId: child.id,
      description: 'Fatura de Teste Corrigida',
      amount: 150.00,
      dueDate: new Date(),
      status: 'PENDENTE'
    }
  })
  
  console.log('Invoice created successfully:', invoice.id)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
