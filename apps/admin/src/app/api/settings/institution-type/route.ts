import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../../lib/auth'

const schema = z.object({
  institutionType: z.string(),
  activeModules:   z.array(z.string()).nullable().optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const school = await prisma.school.update({
      where: { id: user.schoolId },
      data: {
        institutionType: data.institutionType,
        ...(data.activeModules !== null && data.activeModules !== undefined
          ? { activeModules: JSON.stringify(data.activeModules) }
          : {}),
      },
    })

    return NextResponse.json({ ok: true, institutionType: school.institutionType })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
