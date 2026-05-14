import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.user.findMany({
  where: { email: { contains: 'meent' } } // Assuming user might have this in email based on path
})
  .then(users => {
    if (users.length === 0) {
      return p.user.findMany({ take: 5 })
    }
    return users
  })
  .then(users => console.log(JSON.stringify(users, null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect())
