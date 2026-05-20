import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as reportsRepository from './development-reports.repository'
import type { CreateReportInput, UpdateReportInput, ListReportsQuery } from './development-reports.schema'

export async function listReports(schoolId: string, query: ListReportsQuery) {
  const isDraft = query.isDraft !== undefined
    ? query.isDraft === 'true'
    : undefined

  return reportsRepository.findMany({
    schoolId,
    childId: query.childId,
    isDraft,
  })
}

export async function getReportById(id: string, schoolId: string) {
  const report = await reportsRepository.findFirst(id, schoolId)
  if (!report) {
    throw new AppError('Relatorio nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return report
}

export async function createReport(schoolId: string, createdBy: string, input: CreateReportInput) {
  const childIsValid = await reportsRepository.verifyChild(input.childId, schoolId)
  if (!childIsValid) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const { startDate, endDate, publishedAt, ...rest } = input
  const data = {
    ...rest,
    schoolId,
    createdBy,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    ...(publishedAt && { publishedAt: new Date(publishedAt) }),
  }

  return reportsRepository.create(data)
}

export async function updateReport(id: string, schoolId: string, input: UpdateReportInput) {
  const report = await reportsRepository.findFirst(id, schoolId)
  if (!report) {
    throw new AppError('Relatorio nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const { startDate, endDate, publishedAt, ...rest } = input
  const data = {
    ...rest,
    ...(startDate && { startDate: new Date(startDate) }),
    ...(endDate && { endDate: new Date(endDate) }),
    ...(publishedAt && { publishedAt: new Date(publishedAt) }),
  }

  await reportsRepository.update(id, schoolId, data)
  return reportsRepository.findFirst(id, schoolId)
}

export async function deleteReport(id: string, schoolId: string) {
  const result = await reportsRepository.deleteById(id, schoolId)
  if (result.count === 0) {
    throw new AppError('Relatorio nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}

export async function publishReport(id: string, schoolId: string) {
  const report = await reportsRepository.findFirst(id, schoolId)
  if (!report) {
    throw new AppError('Relatorio nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  await reportsRepository.update(id, schoolId, {
    isDraft: false,
    publishedAt: new Date(),
  })

  return reportsRepository.findFirst(id, schoolId)
}
