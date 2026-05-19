export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function normalizeUtcDate(dateInput?: string | Date): Date {
  const source = dateInput ? new Date(dateInput) : new Date()
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate(), 0, 0, 0, 0))
}
