import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.school.findMany()
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect())
