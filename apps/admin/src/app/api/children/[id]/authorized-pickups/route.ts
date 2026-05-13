import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../../lib/auth'

const schema = z.object({
  fullName:      z.string().min(2),
  cpf:           z.string().optional(),
  rg:            z.string().optional(),
  phone:         z.string().min(8),
  relationship:  z.string(),
  photoUrl:      z.string().optional(),
  authorization: z.enum(['SIM', 'NAO', 'TEMPORARIO']).default('SIM'),
  validUntil:    z.string().optional(),
  observations:  z.string().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await prisma.child.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pickups = await prisma.authorizedPickupPerson.findMany({
    where: { childId: params.id },
    orderBy: { fullName: 'asc' },
  })

  return NextResponse.json(pickups)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const child = await prisma.child.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    })
    if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = schema.parse(body)

    const person = await prisma.authorizedPickupPerson.create({
      data: {
        childId:       params.id,
        fullName:      data.fullName,
        cpf:           data.cpf,
        rg:            data.rg,
        phone:         data.phone,
        relationship:  data.relationship,
        photoUrl:      data.photoUrl,
        authorization: data.authorization,
        validUntil:    data.validUntil ? new Date(data.validUntil) : null,
        observations:  data.observations,
      },
    })

    return NextResponse.json(person, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
