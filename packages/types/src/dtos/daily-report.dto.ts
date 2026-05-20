import type { ItemType, MealResult, SleepQuality, Mood } from '../enums'

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
