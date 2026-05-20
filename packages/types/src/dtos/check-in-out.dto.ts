export interface CheckInDto {
  childId: string
  schoolId: string
  broughtBy: string
  broughtByDoc?: string
  checkInSignature?: string
  checkInNote?: string
}

export interface CheckOutDto {
  childId: string
  schoolId: string
  date: string
  pickedUpBy: string
  pickedUpByDoc?: string
  checkOutSignature?: string
  checkOutNote?: string
}
