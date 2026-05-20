import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as photosRepository from './photos.repository'
import type { CreatePhotoInput, ListPhotosQuery } from './photos.schema'

export async function listPhotos(schoolId: string, query: ListPhotosQuery) {
  const sharedWithParents = query.sharedWithParents !== undefined
    ? query.sharedWithParents === 'true'
    : undefined

  return photosRepository.findMany({
    schoolId,
    childId: query.childId,
    groupId: query.groupId,
    sharedWithParents,
  })
}

export async function createPhoto(schoolId: string, input: CreatePhotoInput) {
  if (input.childId) {
    const child = await photosRepository.verifyChild(input.childId, schoolId)
    if (!child) {
      throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  if (input.groupId) {
    const group = await photosRepository.verifyGroup(input.groupId, schoolId)
    if (!group) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { date, ...rest } = input
  const data: any = {
    ...rest,
    schoolId,
    date: date ? new Date(date) : new Date(),
  }

  return photosRepository.create(data)
}

export async function deletePhoto(id: string, schoolId: string) {
  const result = await photosRepository.deleteById(id, schoolId)
  if (result.count === 0) {
    throw new AppError('Foto nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}
