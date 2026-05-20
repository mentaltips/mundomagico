import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import type { CreateInvoiceInput, ListInvoicesQuery, ManualPaymentInput, UpdateInvoiceInput } from './finance.schema'
import * as financeRepository from './finance.repository'

async function validateChildStudentGuardianTenant(
  schoolId: string,
  childId?: string | null,
  studentId?: string | null,
  guardianId?: string | null,
) {
  if (childId) {
    const child = await financeRepository.findChildById(schoolId, childId)
    if (!child) {
      throw new AppError('Operacao nao permitida: A crianca nao pertence a esta escola.', 403, ERROR_CODES.FORBIDDEN)
    }
  }

  if (studentId) {
    const student = await financeRepository.findStudentById(schoolId, studentId)
    if (!student) {
      throw new AppError('Operacao nao permitida: O aluno nao pertence a esta escola.', 403, ERROR_CODES.FORBIDDEN)
    }
  }

  if (guardianId) {
    const guardian = await financeRepository.findGuardianById(schoolId, guardianId)
    if (!guardian) {
      throw new AppError('Operacao nao permitida: O responsavel nao pertence a esta escola.', 403, ERROR_CODES.FORBIDDEN)
    }
  }
}

export function listInvoices(schoolId: string, query: ListInvoicesQuery) {
  return financeRepository.listInvoices(schoolId, query)
}

export async function createInvoices(schoolId: string, input: CreateInvoiceInput | CreateInvoiceInput[]) {
  if (Array.isArray(input)) {
    return Promise.all(
      input.map(async (item) => {
        try {
          await validateChildStudentGuardianTenant(schoolId, item.childId, item.studentId, item.guardianId)
          return await financeRepository.createInvoice(schoolId, item)
        } catch (err: any) {
          return {
            error: err?.message || 'Failed to create',
            childId: item.childId,
            studentId: item.studentId,
            skipped: true,
          }
        }
      }),
    )
  }

  await validateChildStudentGuardianTenant(schoolId, input.childId, input.studentId, input.guardianId)
  return financeRepository.createInvoice(schoolId, input)
}

export async function deleteInvoice(schoolId: string, id: string) {
  const invoice = await financeRepository.findInvoiceById(schoolId, id)
  if (!invoice) {
    throw new AppError('Fatura nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  if (invoice.status === 'PAGO') {
    throw new AppError('Nao e possivel excluir uma fatura paga', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  const cancelled = await financeRepository.cancelInvoice(schoolId, invoice.id)
  if (!cancelled) {
    throw new AppError('Nao foi possivel cancelar a fatura', 400, ERROR_CODES.VALIDATION_ERROR)
  }
}

export async function getInvoiceDetails(schoolId: string, id: string) {
  const invoice = await financeRepository.getInvoiceDetails(schoolId, id)
  if (!invoice) {
    throw new AppError('Fatura nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }
  return invoice
}

export async function updateInvoice(schoolId: string, id: string, input: UpdateInvoiceInput) {
  const invoice = await financeRepository.findInvoiceById(schoolId, id)
  if (!invoice) {
    throw new AppError('Fatura nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  if (input.childId !== undefined || input.studentId !== undefined || input.guardianId !== undefined) {
    await validateChildStudentGuardianTenant(schoolId, input.childId, input.studentId, input.guardianId)
  }

  return financeRepository.updateInvoice(schoolId, invoice.id, input)
}

export async function payInvoiceManually(schoolId: string, id: string, input: ManualPaymentInput) {
  const invoice = await financeRepository.findInvoiceById(schoolId, id)
  if (!invoice) {
    throw new AppError('Fatura nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  if (invoice.status === 'PAGO') {
    throw new AppError('Fatura ja esta paga', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  const updated = await financeRepository.payInvoiceManually(schoolId, invoice, input)
  if (!updated) {
    throw new AppError('Fatura ja esta paga', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  return updated
}
