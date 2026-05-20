import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as documentsRepository from './documents.repository'
import type { CreateDocumentInput } from './documents.schema'

export async function getDocumentById(id: string, schoolId: string) {
  const document = await documentsRepository.findById(id, schoolId)
  if (!document) {
    throw new AppError('Documento nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return document
}

export async function createDocument(schoolId: string, input: CreateDocumentInput) {
  const child = await documentsRepository.verifyChild(input.childId, schoolId)
  if (!child) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  return documentsRepository.create(input)
}

export async function deleteDocument(id: string, schoolId: string) {
  const document = await documentsRepository.findById(id, schoolId)
  if (!document) {
    throw new AppError('Documento nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  await documentsRepository.deleteById(id, schoolId)
  return { success: true }
}
