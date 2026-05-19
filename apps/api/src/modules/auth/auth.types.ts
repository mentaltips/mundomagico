export interface AuthTokenPayload {
  sub: string
  name: string
  email: string
  role: string
  schoolId: string
}

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: string
  schoolId: string
  active: boolean
  avatarUrl?: string | null
}

export interface AuthUserWithPassword extends AuthenticatedUser {
  password: string
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
}
