import type { Shift, ChildStatus } from '../enums'

export interface CreateChildDto {
  schoolId: string
  groupId?: string
  fullName: string
  nickname?: string
  birthDate: string          // ISO
  photoUrl?: string
  gender?: string
  registrationNumber?: string
  shift: Shift
  contractedHours?: string
  entryDate?: string
  status?: ChildStatus
  bloodType?: string
  allergies?: string[]
  continuousMeds?: string[]
  dietaryRestrictions?: string[]
  healthObservations?: string
  usesDiapers?: boolean
  usesBottle?: boolean
  usesNipple?: boolean
  specialSleep?: string
  observations?: string
  imageAuthorized?: boolean
}
