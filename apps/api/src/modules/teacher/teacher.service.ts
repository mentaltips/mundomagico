import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { toDateKey } from '../../shared/utils/date-key'
import * as teacherRepository from './teacher.repository'
import type { RegisterAttendanceInput } from './teacher.schema'

const adminRoles = ['ADMIN', 'ADMIN_ESCOLA', 'DIRETOR']

function isUserAdmin(role?: string) {
  return adminRoles.includes(role || '')
}

export async function getDashboardData(schoolId: string, userId: string, role?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const staff = await teacherRepository.findStaffByUserId(userId, schoolId)

  let groups: any[] = []
  if (staff) {
    const assignments = await teacherRepository.findStaffGroupAssignments(staff.id)
    groups = assignments.map((a) => a.group)
  } else if (isUserAdmin(role)) {
    groups = await teacherRepository.findActiveGroups(schoolId)
  }

  const groupIds = groups.map((g) => g.id)

  const todayCheckIns = await teacherRepository.findCheckInOutsForGroups(schoolId, groupIds, today, todayEnd)
  const pendingReports = await teacherRepository.countPendingReportsForGroups(schoolId, groupIds, today, todayEnd)
  const announcements = await teacherRepository.findTeacherAnnouncements(schoolId)

  return { groups, todayCheckIns, pendingReports, announcements }
}

export async function getClasses(schoolId: string, userId: string, role?: string) {
  const staff = await teacherRepository.findStaffByUserId(userId, schoolId)

  let classes: any[] = []
  if (staff) {
    const assignments = await teacherRepository.findStaffGroupAssignmentsWithDetails(staff.id)
    classes = assignments.map((a) => a.group)
  } else if (isUserAdmin(role)) {
    classes = await teacherRepository.findActiveGroupsWithDetails(schoolId)
  }

  return classes
}

export async function getClassDetails(groupId: string, schoolId: string, userId: string, role?: string) {
  const staff = await teacherRepository.findStaffByUserId(userId, schoolId)

  if (staff) {
    const assignment = await teacherRepository.findStaffGroupAssignment(staff.id, groupId)
    if (!assignment) {
      throw new AppError('Você não tem permissão para acessar esta turma.', 403, ERROR_CODES.FORBIDDEN)
    }
  } else if (!isUserAdmin(role)) {
    throw new AppError('Acesso negado.', 403, ERROR_CODES.FORBIDDEN)
  }

  const group = await teacherRepository.findGroupFirst(groupId, schoolId)
  if (!group) {
    throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND)
  }

  return group
}

export async function getAttendance(
  schoolId: string,
  userId: string,
  role?: string,
  dateQuery?: string,
  groupIdQuery?: string
) {
  const queryDate = dateQuery ? new Date(dateQuery) : new Date()
  queryDate.setHours(0, 0, 0, 0)
  const queryDateEnd = new Date(queryDate)
  queryDateEnd.setHours(23, 59, 59, 999)

  const staff = await teacherRepository.findStaffByUserId(userId, schoolId)

  let targetGroupIds: string[] = []
  if (groupIdQuery) {
    targetGroupIds = [groupIdQuery]
    if (staff) {
      const assignment = await teacherRepository.findStaffGroupAssignment(staff.id, groupIdQuery)
      if (!assignment) {
        throw new AppError('Você não tem permissão para acessar esta turma.', 403, ERROR_CODES.FORBIDDEN)
      }
    } else if (!isUserAdmin(role)) {
      throw new AppError('Acesso negado.', 403, ERROR_CODES.FORBIDDEN)
    }
  } else {
    if (staff) {
      const assignments = await teacherRepository.findStaffGroupAssignments(staff.id)
      targetGroupIds = assignments.map((a) => a.groupId)
    } else if (!isUserAdmin(role)) {
      throw new AppError('Acesso negado.', 403, ERROR_CODES.FORBIDDEN)
    }
  }

  const children = await teacherRepository.findChildrenForAttendance(schoolId, targetGroupIds, groupIdQuery)
  const childIds = children.map((c) => c.id)

  const checkInOuts = await teacherRepository.findCheckInOutsForDateRange(childIds, queryDate, queryDateEnd)
  const checkInOutsMap = new Map(checkInOuts.map((c) => [c.childId, c]))

  return children.map((child) => ({
    ...child,
    checkInOuts: checkInOutsMap.has(child.id) ? [checkInOutsMap.get(child.id)] : [],
  }))
}

export async function registerAttendance(
  schoolId: string,
  userId: string,
  role: string | undefined,
  checkedById: string,
  input: RegisterAttendanceInput
) {
  const staff = await teacherRepository.findStaffByUserId(userId, schoolId)

  if (!staff && !isUserAdmin(role)) {
    throw new AppError('Acesso negado.', 403, ERROR_CODES.FORBIDDEN)
  }

  const childrenIds = input.records.map((r) => r.childId)
  const children = await teacherRepository.findChildrenByIdsAndSchool(childrenIds, schoolId)

  if (children.length !== childrenIds.length) {
    throw new AppError('Uma ou mais crianças não foram encontradas nesta escola.', 400, ERROR_CODES.VALIDATION_ERROR)
  }

  if (staff) {
    const assignments = await teacherRepository.findStaffGroupAssignments(staff.id)
    const allowedGroupIds = assignments.map((a) => a.groupId)

    const unauthorized = children.some((c) => !c.groupId || !allowedGroupIds.includes(c.groupId))
    if (unauthorized) {
      throw new AppError(
        'Você não tem permissão para registrar frequência para uma ou mais crianças selecionadas.',
        403,
        ERROR_CODES.FORBIDDEN
      )
    }
  }

  const recordDate = input.date ? new Date(input.date) : new Date()
  recordDate.setHours(0, 0, 0, 0)
  const dateKey = toDateKey(recordDate)

  const results = await Promise.all(
    input.records.map(async (record) => {
      const updateData = {
        status: record.status,
        checkedById,
        date: recordDate,
        dateKey,
        ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
        ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
      }

      const createData = {
        schoolId,
        childId: record.childId,
        date: recordDate,
        dateKey,
        status: record.status || 'PRESENTE',
        checkedById,
        ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
        ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
      }

      return teacherRepository.upsertCheckInOut(
        { childId_dateKey: { childId: record.childId, dateKey } },
        updateData,
        createData
      )
    })
  )

  return results
}
