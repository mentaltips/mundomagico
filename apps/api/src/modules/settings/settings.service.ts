import { encrypt } from '../../shared/utils/crypto'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { maskSecret } from '../../shared/security/school-secrets'
import { isSecretMask, type UpdateInstitutionTypeInput, type UpdateSettingsInput } from './settings.schema'
import * as settingsRepository from './settings.repository'
import { Prisma } from '@mundo-magico/database'

function formatSettings<T extends Record<string, any>>(school: T) {
  const secrets = school.integrationSecret || {}
  return {
    ...school,
    integrationSecret: undefined,
    whatsappToken: maskSecret(secrets.whatsappToken),
    smtpPass: maskSecret(secrets.smtpPass),
    mpAccessToken: maskSecret(secrets.mpAccessToken),
    mpPublicKey: maskSecret(secrets.mpPublicKey),
  }
}

function formatInstitutionType<T extends Record<string, any>>(school: T) {
  return {
    ...school,
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

  const secretData: Record<string, any> = {}

  if (whatsappToken !== undefined && !isSecretMask(whatsappToken)) {
    secretData.whatsappToken = whatsappToken ? encrypt(whatsappToken) : null
  }
  if (smtpPass !== undefined && !isSecretMask(smtpPass)) {
    secretData.smtpPass = smtpPass ? encrypt(smtpPass) : null
  }
  if (mpAccessToken !== undefined && !isSecretMask(mpAccessToken)) {
    secretData.mpAccessToken = mpAccessToken ? encrypt(mpAccessToken) : null
  }
  if (mpPublicKey !== undefined && !isSecretMask(mpPublicKey)) {
    secretData.mpPublicKey = mpPublicKey ? encrypt(mpPublicKey) : null
  }

  const data: any = {
    ...plainFields,
    billingGenerationDay: plainFields.billingGenerationDay ?? undefined,
  }

  if (Object.keys(secretData).length > 0) {
    data.integrationSecret = {
      upsert: {
        create: secretData,
        update: secretData,
      },
    }
  }

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
  const data: any = {
    ...(input.institutionType && { institutionType: input.institutionType }),
    ...(input.activeModules !== undefined && {
      activeModules: (input.activeModules ?? []) as Prisma.InputJsonValue,
    }),
    ...(input.terminology !== undefined && {
      terminology: (input.terminology ?? {}) as Prisma.InputJsonValue,
    }),
  }

  const school = await settingsRepository.updateInstitutionType(schoolId, data)
  return formatInstitutionType(school)
}
