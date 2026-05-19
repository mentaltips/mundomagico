import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { ERROR_CODES } from '../errors/error-codes'

export type Permission =
  | 'canManageStudents'
  | 'canViewFinance'
  | 'canManageFinance'
  | 'canSendWhatsapp'
  | 'canManageUsers'
  | 'canViewReports'
  | 'canManageStaff'
  | 'canViewPayroll'
  | 'canManagePayroll'
  | 'canViewSensitiveStaffData'
  | 'canManageSchoolSettings'

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: ['canManageStudents', 'canViewFinance', 'canManageFinance', 'canSendWhatsapp', 'canManageUsers', 'canViewReports', 'canManageStaff', 'canViewPayroll', 'canManagePayroll', 'canViewSensitiveStaffData', 'canManageSchoolSettings'],
  ADMIN_ESCOLA: ['canManageStudents', 'canViewFinance', 'canManageFinance', 'canSendWhatsapp', 'canManageUsers', 'canViewReports', 'canManageStaff', 'canViewPayroll', 'canManagePayroll', 'canViewSensitiveStaffData', 'canManageSchoolSettings'],
  DIRETOR: ['canManageStudents', 'canViewFinance', 'canManageFinance', 'canSendWhatsapp', 'canManageUsers', 'canViewReports', 'canManageStaff', 'canViewPayroll', 'canManageSchoolSettings'],
  COORDENADOR: ['canManageStudents', 'canSendWhatsapp', 'canViewReports', 'canManageStaff'],
  PROFESSOR: ['canManageStudents', 'canSendWhatsapp'],
  MONITOR: ['canManageStudents'],
  CUIDADOR: ['canManageStudents'],
  FINANCEIRO: ['canViewFinance', 'canManageFinance', 'canViewReports'],
  FUNCIONARIO: [],
  RESPONSAVEL: [],
}

export function hasPermission(role: string | undefined, permission: Permission) {
  const permissions = role ? rolePermissions[role] ?? [] : []
  return permissions.includes(permission)
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!hasPermission(req.user?.role, permission)) {
      return next(new AppError('Acesso negado', 403, ERROR_CODES.FORBIDDEN))
    }

    return next()
  }
}
