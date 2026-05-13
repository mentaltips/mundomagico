import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../../../lib/auth'

const schema = z.object({
  fullName:      z.string().min(2).optional(),
  cpf:           z.string().optional(),
  rg:            z.string().optional(),
  phone:         z.string().min(8).optional(),
  relationship:  z.string().optional(),
  photoUrl:      z.string().optional(),
  authorization: z.enum(['SIM', 'NAO', 'TEMPORARIO']).optional(),
  validUntil:    z.string().nullable().optional(),
  observations:  z.string().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string; personId: string } },
) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const child = await prisma.child.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    })
    if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = schema.parse(body)

    const person = await prisma.authorizedPickupPerson.update({
      where: { id: params.personId },
      data: {
        ...(data.fullName     !== undefined && { fullName: data.fullName }),
        ...(data.cpf          !== undefined && { cpf: data.cpf }),
        ...(data.rg           !== undefined && { rg: data.rg }),
        ...(data.phone        !== undefined && { phone: data.phone }),
        ...(data.relationship !== undefined && { relationship: data.relationship }),
        ...(data.photoUrl     !== undefined && { photoUrl: data.photoUrl }),
        ...(data.authorization !== undefined && { authorization: data.authorization }),
        ...(data.validUntil   !== undefined && { validUntil: data.validUntil ? new Date(data.validUntil) : null }),
        ...(data.observations !== undefined && { observations: data.observations }),
      },
    })

    return NextResponse.json(person)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; personId: string } },
) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await prisma.child.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.authorizedPickupPerson.delete({ where: { id: params.personId } })
  return NextResponse.json({ ok: true })
}
