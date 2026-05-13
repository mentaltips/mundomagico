import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  childId:          z.string().optional(),
  groupId:          z.string().optional(),
  url:              z.string().min(1),
  caption:          z.string().optional(),
  isPrivate:        z.boolean().default(false),
  sharedWithParents: z.boolean().default(false),
  taggedChildIds:   z.array(z.string()).optional(),
  date:             z.string().optional(),
})

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const groupId = searchParams.get('groupId')

  const photos = await prisma.childPhoto.findMany({
    where: {
      schoolId: user.schoolId,
      ...(childId ? { childId } : {}),
      ...(groupId ? { groupId } : {}),
    },
    include: {
      child: { select: { id: true, fullName: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(photos)
}

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const photo = await prisma.childPhoto.create({
      data: {
        schoolId:          user.schoolId,
        childId:           data.childId,
        groupId:           data.groupId,
        url:               data.url,
        caption:           data.caption,
        isPrivate:         data.isPrivate,
        sharedWithParents: data.sharedWithParents,
        taggedChildIds:    data.taggedChildIds ? JSON.stringify(data.taggedChildIds) : null,
        date:              data.date ? new Date(data.date) : new Date(),
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
