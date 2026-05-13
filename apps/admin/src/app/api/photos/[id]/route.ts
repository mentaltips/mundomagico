import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  caption:           z.string().optional(),
  isPrivate:         z.boolean().optional(),
  sharedWithParents: z.boolean().optional(),
  taggedChildIds:    z.array(z.string()).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const photo = await prisma.childPhoto.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = schema.parse(body)

    const updated = await prisma.childPhoto.update({
      where: { id: params.id },
      data: {
        ...(data.caption           !== undefined && { caption: data.caption }),
        ...(data.isPrivate         !== undefined && { isPrivate: data.isPrivate }),
        ...(data.sharedWithParents !== undefined && { sharedWithParents: data.sharedWithParents }),
        ...(data.taggedChildIds    !== undefined && { taggedChildIds: JSON.stringify(data.taggedChildIds) }),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const photo = await prisma.childPhoto.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.childPhoto.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
