import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('MundoMagico@2024', 10)
  
  const users = [
    { email: 'diretoria@mundomagico.com.br', role: 'DIRECTOR' },
    { email: 'teacher@mundomagico.com.br', role: 'TEACHER' },
    { email: 'maria@email.com', role: 'GUARDIAN' }
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password, role: u.role },
      create: { 
        email: u.email, 
        password, 
        role: u.role,
        name: u.email.split('@')[0]
      }
    })
    console.log(`Usuário garantido: ${u.email} com role ${u.role}`)
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
