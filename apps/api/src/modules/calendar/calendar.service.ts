import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as calendarRepository from './calendar.repository'
import type { CreateEventInput, UpdateEventInput, ListEventsQuery } from './calendar.schema'

export async function listEvents(schoolId: string, query: ListEventsQuery) {
  const startDate = query.startDate ? new Date(query.startDate) : undefined
  const endDate = query.endDate ? new Date(query.endDate) : undefined

  return calendarRepository.findMany({
    schoolId,
    startDate,
    endDate,
  })
}

export async function createEvent(schoolId: string, input: CreateEventInput) {
  if (input.groupId) {
    const groupIsValid = await calendarRepository.verifyGroup(input.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { date, ...rest } = input
  const data = {
    ...rest,
    schoolId,
    date: new Date(date),
  }

  return calendarRepository.create(data)
}

export async function updateEvent(id: string, schoolId: string, input: UpdateEventInput) {
  const event = await calendarRepository.findFirst(id, schoolId)
  if (!event) {
    throw new AppError('Evento nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  if (input.groupId) {
    const groupIsValid = await calendarRepository.verifyGroup(input.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { date, ...rest } = input
  const data = {
    ...rest,
    ...(date && { date: new Date(date) }),
  }

  await calendarRepository.update(id, schoolId, data)
  return calendarRepository.findFirst(id, schoolId)
}

export async function deleteEvent(id: string, schoolId: string) {
  const result = await calendarRepository.deleteById(id, schoolId)
  if (result.count === 0) {
    throw new AppError('Evento nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}
