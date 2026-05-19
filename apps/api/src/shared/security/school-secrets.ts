export const SECRET_MASK = '••••••••'

export const schoolPublicSelect = {
  id: true,
  name: true,
  cnpj: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  logoUrl: true,
} as const

export function maskSecret(value?: string | null) {
  return value ? SECRET_MASK : null
}

