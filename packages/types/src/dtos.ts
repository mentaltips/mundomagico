import type { ChildStatus, Shift, Mood, MealResult, SleepQuality, CheckStatus, ItemType } from './enums'

// ─── Child ───

export interface CreateChildDto {
  schoolId: string
  groupId?: string
  fullName: string
  nickname?: string
  birthDate: string          // ISO
  photoUrl?: string
  gender?: string
  registrationNumber?: string
  shift: Shift
  contractedHours?: string
  entryDate?: string
  status?: ChildStatus
  bloodType?: string
  allergies?: string[]
  continuousMeds?: string[]
  dietaryRestrictions?: string[]
  healthObservations?: string
  usesDiapers?: boolean
  usesBottle?: boolean
  usesNipple?: boolean
  specialSleep?: string
  observations?: string
  imageAuthorized?: boolean
}

// ─── Daily Report ───

export interface CreateDailyReportDto {
  schoolId: string
  childId: string
  date: string
  isDraft?: boolean
  generalNote?: string
  teamNote?: string
  messageToParents?: string
  importantAlert?: string
  homeRecommendation?: string
  itemRequests?: ItemType[]
  meals?: {
    mealType: string
    result: MealResult
    description?: string
    observation?: string
    amount?: string
    time?: string
  }[]
  sleep?: {
    slept: boolean
    sleepTime?: string
    wakeTime?: string
    quality: SleepQuality
    observation?: string
  }
  hygiene?: {
    diaperChanges?: number
    pee?: boolean
    poo?: boolean
    bath?: boolean
    brushing?: boolean
    observation?: string
  }
  health?: {
    fever?: boolean
    feverTemp?: number
    pain?: boolean
    painDescription?: string
    cough?: boolean
    runnyNose?: boolean
    injury?: boolean
    injuryDescription?: string
    medicationGiven?: boolean
    medicationName?: string
    medicationDosage?: string
    medicationTime?: string
    authorizedBy?: string
    observation?: string
  }
  moods?: { mood: Mood; period?: string }[]
  activities?: { activityType: string; description?: string }[]
}

// ─── Check In/Out ───

export interface CheckInDto {
  childId: string
  schoolId: string
  broughtBy: string
  broughtByDoc?: string
  checkInSignature?: string
  checkInNote?: string
}

export interface CheckOutDto {
  childId: string
  schoolId: string
  date: string
  pickedUpBy: string
  pickedUpByDoc?: string
  checkOutSignature?: string
  checkOutNote?: string
}

// ─── WhatsApp message ───

export interface DailyReportWhatsAppData {
  guardianName: string
  childName: string
  schoolName: string
  date: string
  meals: string
  sleep: string
  hygiene: string
  health: string
  mood: string
  activities: string
  message?: string
  alert?: string
}

export function buildWhatsAppMessage(data: DailyReportWhatsAppData): string {
  const lines: string[] = [
    `Olá, ${data.guardianName}! Segue o resumo do dia de *${data.childName}* na *${data.schoolName}* — ${data.date}`,
    '',
    `🍽️ *Alimentação:* ${data.meals}`,
    `😴 *Sono:* ${data.sleep}`,
    `🧼 *Higiene:* ${data.hygiene}`,
  ]

  if (data.health) lines.push(`❤️ *Saúde:* ${data.health}`)
  lines.push(`😊 *Humor:* ${data.mood}`)
  lines.push(`🎨 *Atividades:* ${data.activities}`)

  if (data.message) {
    lines.push('')
    lines.push(`📝 *Recado:* ${data.message}`)
  }

  if (data.alert) {
    lines.push('')
    lines.push(`⚠️ *Aviso:* ${data.alert}`)
  }

  lines.push('')
  lines.push('Até amanhã! 🌟')

  return lines.join('\n')
}
