import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  childId:    z.string(),
  schoolId:   z.string().optional(),
  date:       z.string(),
  type:       z.enum(['in', 'out']),
  personName: z.string(),
  personDoc:  z.string().optional(),
  note:       z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const date = new Date(data.date + 'T00:00:00')
    const now = new Date()

    if (data.type === 'in') {
      const record = await prisma.childCheckInOut.upsert({
        where: { childId_date: { childId: data.childId, date } },
        create: {
          schoolId: user.schoolId,
          childId:   data.childId,
          date,
          checkInTime: now,
          broughtBy: data.personName,
          broughtByDoc: data.personDoc,
          checkInNote: data.note,
          status: 'PRESENTE',
        },
        update: {
          checkInTime: now,
          broughtBy: data.personName,
          broughtByDoc: data.personDoc,
          checkInNote: data.note,
          status: 'PRESENTE',
        },
      })
      return NextResponse.json(record)
    } else {
      // Check-out
      const existing = await prisma.childCheckInOut.findUnique({
        where: { childId_date: { childId: data.childId, date } },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Check-in not found for today' }, { status: 404 })
      }

      const record = await prisma.childCheckInOut.update({
        where: { id: existing.id },
        data: {
          checkOutTime:  now,
          pickedUpBy:    data.personName,
          pickedUpByDoc: data.personDoc,
          checkOutNote:  data.note,
          status:        'SAIU_MAIS_CEDO',
        },
      })
      return NextResponse.json(record)
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
