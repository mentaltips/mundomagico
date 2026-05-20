import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as healthRepository from './health.repository'

export async function getActiveMedicationChildren(schoolId: string) {
  return healthRepository.findChildrenWithActiveMedications(schoolId)
}

export async function listMedications(schoolId: string, childId?: string, active?: boolean) {
  return healthRepository.findMedications({ schoolId, childId, active })
}

export async function createMedication(schoolId: string, input: any) {
  const { childId, startDate, endDate, guardianAuthDate, notes, ...rest } = input

  const child = await healthRepository.verifyChild(childId, schoolId)
  if (!child) {
    throw new AppError('Child not found', 404, ERROR_CODES.NOT_FOUND)
  }

  return healthRepository.createMedication({
    ...rest,
    schoolId,
    childId,
    ...(notes !== undefined && { notes }),
    startDate: new Date(startDate as string),
    ...(endDate && { endDate: new Date(endDate as string) }),
    ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate as string) }),
  })
}

export async function updateMedication(id: string, schoolId: string, input: any) {
  const { childId, startDate, endDate, guardianAuthDate, ...rest } = input

  if (childId) {
    const child = await healthRepository.verifyChild(childId, schoolId)
    if (!child) {
      throw new AppError('Child not found', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const updateData: any = {
    ...rest,
    ...(childId && { childId }),
    ...(startDate && { startDate: new Date(startDate) }),
    ...(endDate && { endDate: new Date(endDate) }),
    ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate) }),
  }

  const result = await healthRepository.updateMedication(id, schoolId, updateData)
  if (result.count === 0) {
    throw new AppError('Medication not found', 404, ERROR_CODES.NOT_FOUND)
  }

  return healthRepository.findMedicationFirst(id, schoolId)
}

export async function administerMedication(
  id: string,
  schoolId: string,
  administeredBy: string,
  input: { administeredAt?: string; dosage?: string; notes?: string | null }
) {
  const medication = await healthRepository.findMedicationFirst(id, schoolId)
  if (!medication) {
    throw new AppError('Medication not found', 404, ERROR_CODES.NOT_FOUND)
  }

  const { administeredAt, dosage, notes } = input

  return healthRepository.createMedicationAdministration({
    medicationId: id,
    administeredBy,
    administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
    dosage: dosage || medication.dosage,
    notes,
  })
}
