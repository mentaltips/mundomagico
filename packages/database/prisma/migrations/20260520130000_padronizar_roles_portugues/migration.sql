-- Padronização de roles para português
-- User.role: valores em inglês → português
UPDATE "User" SET "role" = 'ADMIN_ESCOLA' WHERE "role" = 'SCHOOL_ADMIN';
UPDATE "User" SET "role" = 'DIRETOR' WHERE "role" = 'DIRECTOR';
UPDATE "User" SET "role" = 'COORDENADOR' WHERE "role" = 'COORDINATOR';
UPDATE "User" SET "role" = 'PROFESSOR' WHERE "role" = 'TEACHER';
UPDATE "User" SET "role" = 'CUIDADOR' WHERE "role" = 'CAREGIVER';
UPDATE "User" SET "role" = 'RESPONSAVEL' WHERE "role" = 'GUARDIAN';
UPDATE "User" SET "role" = 'FINANCEIRO' WHERE "role" = 'FINANCE';
UPDATE "User" SET "role" = 'FUNCIONARIO' WHERE "role" = 'STAFF';

-- Staff.roleType: valores em inglês → português
UPDATE "Staff" SET "roleType" = 'PROFESSOR' WHERE "roleType" = 'TEACHER';
UPDATE "Staff" SET "roleType" = 'CUIDADOR' WHERE "roleType" = 'CAREGIVER';
UPDATE "Staff" SET "roleType" = 'COORDENADOR' WHERE "roleType" = 'COORDINATOR';
UPDATE "Staff" SET "roleType" = 'AUXILIAR' WHERE "roleType" = 'ASSISTANT';

-- StaffGroupAssignment.assignmentType: valores em inglês → português
UPDATE "StaffGroupAssignment" SET "assignmentType" = 'PROFESSOR_PRINCIPAL' WHERE "assignmentType" = 'MAIN_TEACHER';
UPDATE "StaffGroupAssignment" SET "assignmentType" = 'AUXILIAR' WHERE "assignmentType" = 'ASSISTANT';
UPDATE "StaffGroupAssignment" SET "assignmentType" = 'CUIDADOR' WHERE "assignmentType" = 'CAREGIVER';

-- Announcement.targetRole: valores em inglês → português
UPDATE "Announcement" SET "targetRole" = 'PROFESSOR' WHERE "targetRole" = 'TEACHER';
UPDATE "Announcement" SET "targetRole" = 'CUIDADOR' WHERE "targetRole" = 'CAREGIVER';
UPDATE "Announcement" SET "targetRole" = 'RESPONSAVEL' WHERE "targetRole" = 'GUARDIAN';
