import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as staffRepository from './staff.repository'
import type {
  CreateStaffInput,
  UpdateStaffInput,
  GeneratePaymentsInput,
  UpdatePaymentInput,
  AddBonusInput,
  AddDeductionInput,
  AssignGroupInput,
} from './staff.schema'

const toNumber = (value: unknown) => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  return Number(value)
}

// --- Staff CRUD Services ---
export async function listStaff(schoolId: string) {
  return staffRepository.findManyStaff(schoolId)
}

export async function createStaffMember(schoolId: string, input: CreateStaffInput) {
  if (input.userId) {
    const userIsValid = await staffRepository.verifyUser(input.userId, schoolId)
    if (!userIsValid) {
      throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { birthDate, baseSalary, paymentDay, ...rest } = input
  const data = {
    ...rest,
    schoolId,
    birthDate: birthDate ? new Date(birthDate) : null,
    baseSalary: baseSalary ?? null,
    paymentDay: paymentDay ?? null,
  }

  return staffRepository.createStaff(data)
}

export async function updateStaffMember(id: string, schoolId: string, input: UpdateStaffInput) {
  const staff = await staffRepository.findStaffFirst(id, schoolId)
  if (!staff) {
    throw new AppError('Funcionario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  if (input.userId) {
    const userIsValid = await staffRepository.verifyUser(input.userId, schoolId)
    if (!userIsValid) {
      throw new AppError('Usuario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const { birthDate, baseSalary, paymentDay, ...rest } = input
  const data = {
    ...rest,
    ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
    ...(baseSalary !== undefined && { baseSalary }),
    ...(paymentDay !== undefined && { paymentDay }),
  }

  await staffRepository.updateStaff(id, schoolId, data)
  return staffRepository.findStaffFirst(id, schoolId)
}

export async function deleteStaffMember(id: string, schoolId: string) {
  const staff = await staffRepository.findStaffFirst(id, schoolId)
  if (!staff) {
    throw new AppError('Funcionario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  await staffRepository.softDeleteStaff(id, schoolId)
  return { success: true }
}

// --- Group Assignments ---
export async function assignToGroup(staffId: string, schoolId: string, input: AssignGroupInput) {
  const staffIsValid = await staffRepository.findStaffFirst(staffId, schoolId)
  if (!staffIsValid) {
    throw new AppError('Funcionario nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }

  const groupIsValid = await staffRepository.verifyGroup(input.groupId, schoolId)
  if (!groupIsValid) {
    throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const existingAssignment = await staffRepository.findAssignment(schoolId, staffId, input.groupId)
  if (existingAssignment) {
    await staffRepository.updateAssignment(existingAssignment.id, schoolId, {
      assignmentType: input.assignmentType || 'PROFESSOR_PRINCIPAL',
      status: 'ACTIVE',
    })
    return staffRepository.findAssignment(schoolId, staffId, input.groupId)
  }

  return staffRepository.createAssignment({
    schoolId,
    staffId,
    groupId: input.groupId,
    assignmentType: input.assignmentType || 'PROFESSOR_PRINCIPAL',
    status: 'ACTIVE',
  })
}

export async function removeAssignment(staffId: string, assignmentId: string, schoolId: string) {
  const result = await staffRepository.deleteAssignment(assignmentId, staffId, schoolId)
  if (result.count === 0) {
    throw new AppError('Vinculo nao encontrado', 404, ERROR_CODES.NOT_FOUND)
  }
  return { success: true }
}

// --- Payments ---
export async function listPayments(schoolId: string, filters: {
  month?: string
  year?: string
  staffId?: string
  status?: string
}) {
  return staffRepository.findPayments({
    schoolId,
    referenceMonth: filters.month ? parseInt(filters.month) : undefined,
    referenceYear: filters.year ? parseInt(filters.year) : undefined,
    staffId: filters.staffId,
    status: filters.status,
  })
}

export async function generatePayments(schoolId: string, createdBy: string, input: GeneratePaymentsInput) {
  const staffMembers = await staffRepository.findActiveStaffMembers(schoolId, input.staffId)
  const generatedList: any[] = []

  for (const staff of staffMembers) {
    const baseSalary = toNumber(staff.baseSalary)

    const existing = await staffRepository.findPaymentUnique(staff.id, input.month, input.year)
    if (existing) {
      generatedList.push({ staffId: staff.id, name: staff.name, skipped: true, reason: 'Já gerado' })
      continue
    }

    const payment = await staffRepository.createPayment({
      schoolId,
      staffId: staff.id,
      referenceMonth: input.month,
      referenceYear: input.year,
      baseSalary,
      totalBonuses: 0,
      totalDeductions: 0,
      finalAmount: baseSalary,
      status: 'DRAFT',
      createdBy,
    })

    generatedList.push({ staffId: staff.id, name: staff.name, success: true, paymentId: payment.id })
  }

  return generatedList
}

export async function updatePaymentSheet(id: string, schoolId: string, input: UpdatePaymentInput) {
  const payment = await staffRepository.findPaymentFirst(id, schoolId)
  if (!payment) {
    throw new AppError('Folha de pagamento nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const { paymentDate, ...rest } = input
  const data = {
    ...rest,
    ...(paymentDate && { paymentDate: new Date(paymentDate) }),
  }

  await staffRepository.updatePayment(id, schoolId, data)
  return staffRepository.findPaymentFirst(id, schoolId)
}

export async function addPaymentBonus(paymentId: string, schoolId: string, createdBy: string, input: AddBonusInput) {
  const payment = await staffRepository.findPaymentFirst(paymentId, schoolId)
  if (!payment) {
    throw new AppError('Folha de pagamento nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const bonus = await staffRepository.createBonus({
    schoolId,
    staffId: payment.staffId,
    staffPaymentId: paymentId,
    title: input.title,
    description: input.description,
    amount: input.amount,
    type: input.type || 'MANUAL',
    createdBy,
  })

  const bonuses = await staffRepository.findBonuses(paymentId, schoolId)
  const totalBonuses = bonuses.reduce((acc: number, b: any) => acc + toNumber(b.amount), 0)
  const finalAmount = toNumber(payment.baseSalary) + totalBonuses - toNumber(payment.totalDeductions)

  await staffRepository.updatePayment(paymentId, schoolId, { totalBonuses, finalAmount })

  return bonus
}

export async function addPaymentDeduction(paymentId: string, schoolId: string, createdBy: string, input: AddDeductionInput) {
  const payment = await staffRepository.findPaymentFirst(paymentId, schoolId)
  if (!payment) {
    throw new AppError('Folha de pagamento nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const deduction = await staffRepository.createDeduction({
    schoolId,
    staffId: payment.staffId,
    staffPaymentId: paymentId,
    title: input.title,
    description: input.description,
    amount: input.amount,
    type: input.type || 'DISCOUNT',
    createdBy,
  })

  const deductions = await staffRepository.findDeductions(paymentId, schoolId)
  const totalDeductions = deductions.reduce((acc: number, d: any) => acc + toNumber(d.amount), 0)
  const finalAmount = toNumber(payment.baseSalary) + toNumber(payment.totalBonuses) - totalDeductions

  await staffRepository.updatePayment(paymentId, schoolId, { totalDeductions, finalAmount })

  return deduction
}
