import { encrypt } from '../../shared/utils/crypto'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { maskSecret } from '../../shared/security/school-secrets'
import { isSecretMask, type UpdateInstitutionTypeInput, type UpdateSettingsInput } from './settings.schema'
import * as settingsRepository from './settings.repository'

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function stringifyJsonInput(value: unknown, fallback: string) {
  if (value === undefined) return undefined
  if (value === null) return fallback
  if (typeof value === 'string') return value || fallback
  return JSON.stringify(value)
}

function applySecretField(data: Record<string, unknown>, field: string, value: string | null | undefined) {
  if (value === undefined || isSecretMask(value)) return
  data[field] = value ? encrypt(value) : null
}

function formatSettings<T extends Record<string, any>>(school: T) {
  return {
    ...school,
    activeModules: parseJsonField(school.activeModules, []),
    terminology: parseJsonField(school.terminology, {}),
    whatsappToken: maskSecret(school.whatsappToken),
    smtpPass: maskSecret(school.smtpPass),
    mpAccessToken: maskSecret(school.mpAccessToken),
    mpPublicKey: maskSecret(school.mpPublicKey),
  }
}

function formatInstitutionType<T extends { activeModules?: string | null; terminology?: string | null }>(school: T) {
  return {
    ...school,
    activeModules: parseJsonField(school.activeModules, []),
    terminology: parseJsonField(school.terminology, {}),
  }
}

export async function getSettings(schoolId: string) {
  const school = await settingsRepository.findSettings(schoolId)
  if (!school) {
    throw new AppError('Escola nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  return formatSettings(school)
}

export async function updateSettings(schoolId: string, input: UpdateSettingsInput) {
  const {
    whatsappToken,
    smtpPass,
    mpAccessToken,
    mpPublicKey,
    ...plainFields
  } = input

  const data: Record<string, unknown> = { ...plainFields }

  applySecretField(data, 'whatsappToken', whatsappToken)
  applySecretField(data, 'smtpPass', smtpPass)
  applySecretField(data, 'mpAccessToken', mpAccessToken)
  applySecretField(data, 'mpPublicKey', mpPublicKey)

  const school = await settingsRepository.updateSettings(schoolId, data)
  return formatSettings(school)
}

export async function getInstitutionType(schoolId: string) {
  const school = await settingsRepository.findInstitutionType(schoolId)
  if (!school) {
    throw new AppError('Escola nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  return formatInstitutionType(school)
}

export async function updateInstitutionType(schoolId: string, input: UpdateInstitutionTypeInput) {
  const data = {
    ...(input.institutionType && { institutionType: input.institutionType }),
    ...(input.activeModules !== undefined && {
      activeModules: stringifyJsonInput(input.activeModules, '[]'),
    }),
    ...(input.terminology !== undefined && {
      terminology: stringifyJsonInput(input.terminology, '{}'),
    }),
  }

  const school = await settingsRepository.updateInstitutionType(schoolId, data)
  return formatInstitutionType(school)
}
