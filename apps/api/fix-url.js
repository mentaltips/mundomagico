const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const children = await prisma.child.findMany({
    where: { photoUrl: { contains: 'http://localhost:3333' } }
  });
  console.log('Found ' + children.length + ' children with bad URLs');
  for (const child of children) {
    const newUrl = child.photoUrl.replace('http://localhost:3333', 'https://api.mundomagicocajamar.com.br');
    await prisma.child.update({
      where: { id: child.id },
      data: { photoUrl: newUrl }
    });
    console.log('Fixed child ' + child.id);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
