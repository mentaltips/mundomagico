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
