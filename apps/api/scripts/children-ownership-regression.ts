import assert from 'node:assert/strict'
import { prisma } from '@mundo-magico/database'
import * as childrenService from '../src/modules/children/children.service'

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const schoolId = `ownership-school-${suffix}`
const parentUserId = `ownership-parent-user-${suffix}`
const otherUserId = `ownership-other-user-${suffix}`
const parentGuardianId = `ownership-parent-guardian-${suffix}`
const otherGuardianId = `ownership-other-guardian-${suffix}`
const ownChildId = `ownership-own-child-${suffix}`
const otherChildId = `ownership-other-child-${suffix}`

async function cleanup() {
  await prisma.childGuardian.deleteMany({
    where: {
      OR: [
        { childId: ownChildId },
        { childId: otherChildId },
        { guardianId: parentGuardianId },
        { guardianId: otherGuardianId },
      ],
    },
  })
  await prisma.child.deleteMany({ where: { id: { in: [ownChildId, otherChildId] } } })
  await prisma.guardian.deleteMany({ where: { id: { in: [parentGuardianId, otherGuardianId] } } })
  await prisma.user.deleteMany({ where: { id: { in: [parentUserId, otherUserId] } } })
  await prisma.school.deleteMany({ where: { id: schoolId } })
}

async function seed() {
  await prisma.school.create({
    data: {
      id: schoolId,
      name: 'Ownership Regression School',
    },
  })

  await prisma.user.createMany({
    data: [
      {
        id: parentUserId,
        schoolId,
        name: 'Parent One',
        email: `parent-one-${suffix}@example.test`,
        password: 'not-used',
        role: 'RESPONSAVEL',
      },
      {
        id: otherUserId,
        schoolId,
        name: 'Parent Two',
        email: `parent-two-${suffix}@example.test`,
        password: 'not-used',
        role: 'RESPONSAVEL',
      },
    ],
  })

  await prisma.guardian.createMany({
    data: [
      {
        id: parentGuardianId,
        schoolId,
        userId: parentUserId,
        fullName: 'Parent One',
        phone: '11900000001',
        relationship: 'MAE',
      },
      {
        id: otherGuardianId,
        schoolId,
        userId: otherUserId,
        fullName: 'Parent Two',
        phone: '11900000002',
        relationship: 'PAI',
      },
    ],
  })

  await prisma.child.createMany({
    data: [
      {
        id: ownChildId,
        schoolId,
        fullName: 'Own Child',
        birthDate: new Date('2021-01-01'),
      },
      {
        id: otherChildId,
        schoolId,
        fullName: 'Other Child',
        birthDate: new Date('2021-01-02'),
      },
    ],
  })

  await prisma.childGuardian.createMany({
    data: [
      { childId: ownChildId, guardianId: parentGuardianId, isPrimary: true },
      { childId: otherChildId, guardianId: otherGuardianId, isPrimary: true },
    ],
  })
}

async function run() {
  await cleanup()
  await seed()

  const parentAccess = { userId: parentUserId, role: 'RESPONSAVEL' }
  const staffAccess = { userId: 'staff-user', role: 'ADMIN' }

  const parentChildren = await childrenService.listChildren(schoolId, parentAccess)
  assert.deepEqual(parentChildren.map((child) => child.id), [ownChildId])

  const ownChild = await childrenService.getChild(schoolId, ownChildId, parentAccess)
  assert.equal(ownChild.id, ownChildId)

  await assert.rejects(
    () => childrenService.getChild(schoolId, otherChildId, parentAccess),
    /Crianca nao encontrada/,
  )

  await assert.rejects(
    () => childrenService.listGuardians(schoolId, otherChildId, parentAccess),
    /Crianca nao encontrada/,
  )

  const staffChildren = await childrenService.listChildren(schoolId, staffAccess)
  assert.equal(staffChildren.length, 2)
}

run()
  .then(async () => {
    await cleanup()
    await prisma.$disconnect()
    console.log('Children ownership regression passed.')
  })
  .catch(async (error) => {
    await cleanup()
    await prisma.$disconnect()
    throw error
  })
