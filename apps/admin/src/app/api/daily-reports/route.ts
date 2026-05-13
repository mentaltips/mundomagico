import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'
import { getApiAuth } from '../../../lib/auth'

const mealSchema = z.object({
  mealType:    z.string(),
  result:      z.string(),
  description: z.string().optional(),
  observation: z.string().optional(),
  amount:      z.string().optional(),
  time:        z.string().optional(),
})

const schema = z.object({
  schoolId:           z.string().optional(),
  childId:            z.string(),
  date:               z.string(),
  isDraft:            z.boolean().default(true),
  generalNote:        z.string().optional(),
  teamNote:           z.string().optional(),
  messageToParents:   z.string().optional(),
  importantAlert:     z.string().optional(),
  homeRecommendation: z.string().optional(),
  itemRequests:       z.array(z.string()).optional(),
  meals:              z.array(mealSchema).optional(),
  sleep: z.object({
    slept:       z.boolean(),
    sleepTime:   z.string().optional(),
    wakeTime:    z.string().optional(),
    quality:     z.string(),
    observation: z.string().optional(),
  }).optional(),
  hygiene: z.object({
    diaperChanges: z.number().optional(),
    pee:           z.boolean().optional(),
    poo:           z.boolean().optional(),
    bath:          z.boolean().optional(),
    brushing:      z.boolean().optional(),
    observation:   z.string().optional(),
  }).optional(),
  health: z.object({
    fever:              z.boolean().optional(),
    feverTemp:          z.number().nullable().optional(),
    pain:               z.boolean().optional(),
    painDescription:    z.string().optional(),
    cough:              z.boolean().optional(),
    runnyNose:          z.boolean().optional(),
    injury:             z.boolean().optional(),
    injuryDescription:  z.string().optional(),
    medicationGiven:    z.boolean().optional(),
    medicationName:     z.string().optional(),
    medicationTime:     z.string().optional(),
    authorizedBy:       z.string().optional(),
    observation:        z.string().optional(),
  }).optional(),
  moods:      z.array(z.object({ mood: z.string(), period: z.string().optional() })).optional(),
  activities: z.array(z.object({ activityType: z.string(), description: z.string().optional() })).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const date = new Date(data.date + 'T00:00:00')

    // Criar ou atualizar o diário
    const report = await prisma.childDailyReport.upsert({
      where: { childId_date: { childId: data.childId, date } },
      create: {
        schoolId:           user.schoolId,
        childId:            data.childId,
        date,
        isDraft:            data.isDraft,
        generalNote:        data.generalNote,
        teamNote:           data.teamNote,
        messageToParents:   data.messageToParents,
        importantAlert:     data.importantAlert,
        homeRecommendation: data.homeRecommendation,
        itemRequests:       data.itemRequests ? JSON.stringify(data.itemRequests) : null,
        createdBy:          user.id,
      },
      update: {
        isDraft:            data.isDraft,
        generalNote:        data.generalNote,
        teamNote:           data.teamNote,
        messageToParents:   data.messageToParents,
        importantAlert:     data.importantAlert,
        homeRecommendation: data.homeRecommendation,
        itemRequests:       data.itemRequests ? JSON.stringify(data.itemRequests) : null,
      },
    })

    // Recriar refeições
    if (data.meals) {
      await prisma.dailyMeal.deleteMany({ where: { reportId: report.id } })
      await prisma.dailyMeal.createMany({
        data: data.meals.map((m) => ({ ...m, reportId: report.id })),
      })
    }

    // Upsert sono
    if (data.sleep) {
      await prisma.dailySleep.upsert({
        where: { reportId: report.id },
        create: { ...data.sleep, reportId: report.id },
        update: data.sleep,
      })
    }

    // Upsert higiene
    if (data.hygiene) {
      await prisma.dailyHygiene.upsert({
        where: { reportId: report.id },
        create: { ...data.hygiene, reportId: report.id },
        update: data.hygiene,
      })
    }

    // Upsert saúde
    if (data.health) {
      await prisma.dailyHealth.upsert({
        where: { reportId: report.id },
        create: { ...data.health, reportId: report.id },
        update: data.health,
      })
    }

    // Recriar humor
    if (data.moods) {
      await prisma.dailyMood.deleteMany({ where: { reportId: report.id } })
      await prisma.dailyMood.createMany({
        data: data.moods.map((m) => ({ ...m, reportId: report.id })),
      })
    }

    // Recriar atividades
    if (data.activities) {
      await prisma.dailyActivity.deleteMany({ where: { reportId: report.id } })
      await prisma.dailyActivity.createMany({
        data: data.activities.map((a) => ({ ...a, reportId: report.id })),
      })
    }

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
