import { describe, it, expect } from 'vitest'
import { hasPermission } from '../../shared/middlewares/permissions.middleware'

describe('hasPermission (permissions system)', () => {
  describe('ADMIN', () => {
    it('tem todas as permissões', () => {
      expect(hasPermission('ADMIN', 'canManageStudents')).toBe(true)
      expect(hasPermission('ADMIN', 'canViewFinance')).toBe(true)
      expect(hasPermission('ADMIN', 'canManageFinance')).toBe(true)
      expect(hasPermission('ADMIN', 'canSendWhatsapp')).toBe(true)
      expect(hasPermission('ADMIN', 'canManageUsers')).toBe(true)
      expect(hasPermission('ADMIN', 'canViewReports')).toBe(true)
      expect(hasPermission('ADMIN', 'canManageStaff')).toBe(true)
      expect(hasPermission('ADMIN', 'canViewPayroll')).toBe(true)
      expect(hasPermission('ADMIN', 'canManagePayroll')).toBe(true)
      expect(hasPermission('ADMIN', 'canViewSensitiveStaffData')).toBe(true)
      expect(hasPermission('ADMIN', 'canManageSchoolSettings')).toBe(true)
    })
  })

  describe('ADMIN_ESCOLA', () => {
    it('tem as mesmas permissões que ADMIN', () => {
      expect(hasPermission('ADMIN_ESCOLA', 'canManageStudents')).toBe(true)
      expect(hasPermission('ADMIN_ESCOLA', 'canManageFinance')).toBe(true)
      expect(hasPermission('ADMIN_ESCOLA', 'canManageSchoolSettings')).toBe(true)
    })
  })

  describe('DIRETOR', () => {
    it('tem permissões de gestão mas não folha sensível', () => {
      expect(hasPermission('DIRETOR', 'canManageStudents')).toBe(true)
      expect(hasPermission('DIRETOR', 'canViewFinance')).toBe(true)
      expect(hasPermission('DIRETOR', 'canManageSchoolSettings')).toBe(true)
      expect(hasPermission('DIRETOR', 'canViewSensitiveStaffData')).toBe(false)
      expect(hasPermission('DIRETOR', 'canManagePayroll')).toBe(false)
    })
  })

  describe('COORDENADOR', () => {
    it('tem permissões de coordenação pedagógica', () => {
      expect(hasPermission('COORDENADOR', 'canManageStudents')).toBe(true)
      expect(hasPermission('COORDENADOR', 'canSendWhatsapp')).toBe(true)
      expect(hasPermission('COORDENADOR', 'canViewReports')).toBe(true)
      expect(hasPermission('COORDENADOR', 'canManageStaff')).toBe(true)
    })

    it('não tem acesso financeiro', () => {
      expect(hasPermission('COORDENADOR', 'canViewFinance')).toBe(false)
      expect(hasPermission('COORDENADOR', 'canManageFinance')).toBe(false)
    })

    it('não gerencia usuários', () => {
      expect(hasPermission('COORDENADOR', 'canManageUsers')).toBe(false)
    })
  })

  describe('PROFESSOR', () => {
    it('gerencia alunos e envia WhatsApp', () => {
      expect(hasPermission('PROFESSOR', 'canManageStudents')).toBe(true)
      expect(hasPermission('PROFESSOR', 'canSendWhatsapp')).toBe(true)
    })

    it('não acessa finanças nem relatórios administrativos', () => {
      expect(hasPermission('PROFESSOR', 'canViewFinance')).toBe(false)
      expect(hasPermission('PROFESSOR', 'canManageStaff')).toBe(false)
    })
  })

  describe('MONITOR e CUIDADOR', () => {
    it('só gerenciam alunos', () => {
      expect(hasPermission('MONITOR', 'canManageStudents')).toBe(true)
      expect(hasPermission('CUIDADOR', 'canManageStudents')).toBe(true)
      expect(hasPermission('MONITOR', 'canSendWhatsapp')).toBe(false)
      expect(hasPermission('CUIDADOR', 'canViewFinance')).toBe(false)
    })
  })

  describe('FINANCEIRO', () => {
    it('acessa finanças e relatórios, mas não alunos', () => {
      expect(hasPermission('FINANCEIRO', 'canViewFinance')).toBe(true)
      expect(hasPermission('FINANCEIRO', 'canManageFinance')).toBe(true)
      expect(hasPermission('FINANCEIRO', 'canViewReports')).toBe(true)
      expect(hasPermission('FINANCEIRO', 'canManageStudents')).toBe(false)
      expect(hasPermission('FINANCEIRO', 'canSendWhatsapp')).toBe(false)
    })
  })

  describe('RESPONSAVEL e FUNCIONARIO', () => {
    it('não têm nenhuma permissão administrativa', () => {
      expect(hasPermission('RESPONSAVEL', 'canManageStudents')).toBe(false)
      expect(hasPermission('RESPONSAVEL', 'canViewFinance')).toBe(false)
      expect(hasPermission('FUNCIONARIO', 'canManageStudents')).toBe(false)
      expect(hasPermission('FUNCIONARIO', 'canViewReports')).toBe(false)
    })
  })

  describe('role inexistente ou undefined', () => {
    it('retorna false para role não cadastrada', () => {
      expect(hasPermission('INEXISTENTE', 'canManageStudents')).toBe(false)
    })

    it('retorna false para role undefined', () => {
      expect(hasPermission(undefined, 'canManageStudents')).toBe(false)
    })
  })

  describe('permission inexistente', () => {
    it('retorna false para permission não definida', () => {
      // @ts-expect-error testando permissão inexistente
      expect(hasPermission('ADMIN', 'canDeleteDatabase')).toBe(false)
    })
  })
})
