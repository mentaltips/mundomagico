import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const schema = z.object({
  name:          z.string().min(2).optional(),
  cnpj:          z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email().optional(),
  address:       z.string().optional(),
  city:          z.string().optional(),
  state:         z.string().optional(),
  zipCode:       z.string().optional(),
  logoUrl:       z.string().optional(),
  whatsappToken: z.string().optional(),
  whatsappPhone: z.string().optional(),
  smtpHost:      z.string().optional(),
  smtpPort:      z.number().int().optional(),
  smtpUser:      z.string().optional(),
  smtpPass:      z.string().optional(),
  smtpFrom:      z.string().optional(),
  mpAccessToken: z.string().optional(),
  mpPublicKey:   z.string().optional(),
})

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const school = await prisma.school.findUnique({
    where: { id: user.schoolId },
    select: {
      id: true, name: true, cnpj: true, phone: true, email: true,
      address: true, city: true, state: true, zipCode: true, logoUrl: true,
      institutionType: true, activeModules: true,
      whatsappToken: true, whatsappPhone: true,
      smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true,
      mpPublicKey: true,
    },
  })

  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })
  return NextResponse.json(school)
}

export async function PUT(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const school = await prisma.school.update({
      where: { id: user.schoolId },
      data: {
        ...(data.name          !== undefined && { name: data.name }),
        ...(data.cnpj          !== undefined && { cnpj: data.cnpj }),
        ...(data.phone         !== undefined && { phone: data.phone }),
        ...(data.email         !== undefined && { email: data.email }),
        ...(data.address       !== undefined && { address: data.address }),
        ...(data.city          !== undefined && { city: data.city }),
        ...(data.state         !== undefined && { state: data.state }),
        ...(data.zipCode       !== undefined && { zipCode: data.zipCode }),
        ...(data.logoUrl       !== undefined && { logoUrl: data.logoUrl }),
        ...(data.whatsappToken !== undefined && { whatsappToken: data.whatsappToken }),
        ...(data.whatsappPhone !== undefined && { whatsappPhone: data.whatsappPhone }),
        ...(data.smtpHost      !== undefined && { smtpHost: data.smtpHost }),
        ...(data.smtpPort      !== undefined && { smtpPort: data.smtpPort }),
        ...(data.smtpUser      !== undefined && { smtpUser: data.smtpUser }),
        ...(data.smtpPass      !== undefined && { smtpPass: data.smtpPass }),
        ...(data.smtpFrom      !== undefined && { smtpFrom: data.smtpFrom }),
        ...(data.mpAccessToken !== undefined && { mpAccessToken: data.mpAccessToken }),
        ...(data.mpPublicKey   !== undefined && { mpPublicKey: data.mpPublicKey }),
      },
      select: {
        id: true, name: true, cnpj: true, phone: true, email: true,
        address: true, city: true, state: true, zipCode: true, logoUrl: true,
        institutionType: true,
      },
    })

    return NextResponse.json(school)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
