import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../../lib/auth'

const schema = z.object({
  name:    z.string().min(1),
  docType: z.string(),
  url:     z.string().min(1),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await prisma.child.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
  })
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const documents = await prisma.childDocument.findMany({
    where: { childId: params.id },
    orderBy: { uploadedAt: 'desc' },
  })

  return NextResponse.json(documents)
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

    const doc = await prisma.childDocument.create({
      data: {
        childId: params.id,
        name:    data.name,
        docType: data.docType,
        url:     data.url,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
