import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  schoolId:            z.string().optional(),
  groupId:             z.string().optional(),
  fullName:            z.string().min(2),
  nickname:            z.string().optional(),
  birthDate:           z.string(),
  gender:              z.string().optional(),
  photoUrl:            z.string().optional(),
  registrationNumber:  z.string().optional(),
  shift:               z.string().default('MANHA'),
  contractedHours:     z.string().optional(),
  entryDate:           z.string().optional(),
  status:              z.string().default('ATIVO'),
  bloodType:           z.string().optional(),
  allergies:           z.array(z.string()).optional(),
  continuousMeds:      z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  healthObservations:  z.string().optional(),
  usesDiapers:         z.boolean().default(false),
  usesBottle:          z.boolean().default(false),
  usesNipple:          z.boolean().default(false),
  specialSleep:        z.string().optional(),
  observations:        z.string().optional(),
  imageAuthorized:     z.boolean().default(false),
})

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const groupId = searchParams.get('groupId')

  const children = await prisma.child.findMany({
    where: {
      schoolId: user.schoolId,
      ...(status   ? { status }   : {}),
      ...(groupId  ? { groupId }  : {}),
    },
    include: {
      group: true,
      guardians: { include: { guardian: true }, where: { isPrimary: true } },
    },
    orderBy: { fullName: 'asc' },
  })

  return NextResponse.json(children)
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const child = await prisma.child.create({
      data: {
        schoolId:            user.schoolId,
        groupId:             data.groupId,
        fullName:            data.fullName,
        nickname:            data.nickname,
        birthDate:           new Date(data.birthDate),
        gender:              data.gender,
        photoUrl:            data.photoUrl,
        registrationNumber:  data.registrationNumber,
        shift:               data.shift,
        contractedHours:     data.contractedHours,
        entryDate:           data.entryDate ? new Date(data.entryDate) : new Date(),
        status:              data.status,
        bloodType:           data.bloodType,
        allergies:           data.allergies ? JSON.stringify(data.allergies) : null,
        continuousMeds:      data.continuousMeds ? JSON.stringify(data.continuousMeds) : null,
        dietaryRestrictions: data.dietaryRestrictions ? JSON.stringify(data.dietaryRestrictions) : null,
        healthObservations:  data.healthObservations,
        usesDiapers:         data.usesDiapers,
        usesBottle:          data.usesBottle,
        usesNipple:          data.usesNipple,
        specialSleep:        data.specialSleep,
        observations:        data.observations,
        imageAuthorized:     data.imageAuthorized,
      },
    })

    return NextResponse.json(child, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
