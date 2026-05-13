import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('MundoMagico@2024', 10)
  
  const emails = [
    'diretoria@mundomagico.com.br',
    'teacher@mundomagico.com.br',
    'maria@email.com'
  ]

  for (const email of emails) {
    await prisma.user.update({
      where: { email },
      data: { password }
    })
    console.log(`Senha atualizada para: ${email}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
