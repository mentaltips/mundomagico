import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as childItemsRepository from './child-items.repository'
import type {
  CreateChildItemInput,
  UpdateChildItemInput,
  RegisterUsageInput,
  ReplenishInput,
} from './child-items.schema'

export async function listItems(schoolId: string, childId?: string) {
  return childItemsRepository.findMany(schoolId, childId)
}

export async function createItem(schoolId: string, input: CreateChildItemInput) {
  const childIsValid = await childItemsRepository.verifyChild(input.childId, schoolId)
  if (!childIsValid) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const { lastReplenished, quantityReceived, alertThreshold, ...rest } = input
  const data = {
    ...rest,
    schoolId,
    quantityReceived: quantityReceived || 0,
    alertThreshold: alertThreshold || 5,
    ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
  }

  return childItemsRepository.create(data)
}

export async function updateItem(id: string, schoolId: string, input: UpdateChildItemInput) {
  const item = await childItemsRepository.findFirst(id, schoolId)
  if (!item) {
    throw new AppError('Item nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const { lastReplenished, ...rest } = input
  const data = {
    ...rest,
    ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
  }

  await childItemsRepository.update(id, schoolId, data)
  return childItemsRepository.findFirst(id, schoolId)
}

export async function deleteItem(id: string, schoolId: string) {
  const result = await childItemsRepository.deleteById(id, schoolId)
  if (result.count === 0) {
    const existing = await childItemsRepository.findAnyById(id, schoolId)
    if (existing && existing.active === false) {
      return { success: true, alreadyRemoved: true }
    }
    throw new AppError('Item nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}

export async function registerUsage(id: string, schoolId: string, input: RegisterUsageInput) {
  const item = await childItemsRepository.findFirst(id, schoolId)
  if (!item) {
    throw new AppError('Item nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const quantity = input.quantity ?? 1
  const [usage] = await Promise.all([
    childItemsRepository.createUsageRecord({
      itemId: id,
      quantity,
      notes: input.notes,
    }),
    childItemsRepository.incrementUsage(id, schoolId, quantity),
  ])

  return usage
}

export async function replenishStock(id: string, schoolId: string, input: ReplenishInput) {
  const item = await childItemsRepository.findFirst(id, schoolId)
  if (!item) {
    throw new AppError('Item nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const quantity = input.quantity ?? 0
  await childItemsRepository.replenishStock(id, schoolId, quantity, input.notes)
  return childItemsRepository.findFirst(id, schoolId)
}
