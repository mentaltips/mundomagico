import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  groupId:             z.string().optional().nullable(),
  fullName:            z.string().min(2),
  nickname:            z.string().optional().nullable(),
  birthDate:           z.string(),
  gender:              z.string().optional().nullable(),
  photoUrl:            z.string().optional().nullable(),
  registrationNumber:  z.string().optional().nullable(),
  shift:               z.string().default('MANHA'),
  contractedHours:     z.string().optional().nullable(),
  entryDate:           z.string().optional(),
  status:              z.string().default('ATIVO'),
  bloodType:           z.string().optional().nullable(),
  allergies:           z.array(z.string()).optional().nullable(),
  continuousMeds:      z.array(z.string()).optional().nullable(),
  dietaryRestrictions: z.array(z.string()).optional().nullable(),
  healthObservations:  z.string().optional().nullable(),
  usesDiapers:         z.boolean().default(false),
  usesBottle:          z.boolean().default(false),
  usesNipple:          z.boolean().default(false),
  specialSleep:        z.string().optional().nullable(),
  observations:        z.string().optional().nullable(),
  imageAuthorized:     z.boolean().default(false),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.child.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Criança não encontrada' }, { status: 404 })
    }

    const child = await prisma.child.update({
      where: { id: params.id },
      data: {
        groupId:             data.groupId,
        fullName:            data.fullName,
        nickname:            data.nickname,
        birthDate:           new Date(data.birthDate),
        gender:              data.gender,
        photoUrl:            data.photoUrl,
        registrationNumber:  data.registrationNumber,
        shift:               data.shift,
        contractedHours:     data.contractedHours,
        entryDate:           data.entryDate ? new Date(data.entryDate) : undefined,
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

    return NextResponse.json(child)
  } catch (err) {
    console.error(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.child.findUnique({ where: { id: params.id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Criança não encontrada' }, { status: 404 })
    }

    await prisma.child.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
