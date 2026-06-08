import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as childrenRepository from '../../modules/children/children.repository'
import {
  listChildren,
  createChild,
  getChild,
  updateChild,
  deleteChild,
  listGuardians,
  listAuthorizedPickups,
  createAuthorizedPickup,
  deleteAuthorizedPickup,
  listDocuments,
} from '../../modules/children/children.service'
import { AppError } from '../../shared/errors/AppError'

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../../modules/children/children.repository')

// ─── Factories ──────────────────────────────────────────────
function mockChild(overrides: Record<string, unknown> = {}) {
  return {
    id: 'child-1',
    fullName: 'João Silva',
    birthDate: new Date('2020-03-15'),
    schoolId: 'school-1',
    status: 'ATIVO',
    shift: 'MANHA',
    archivedAt: null,
    group: { id: 'group-1', name: 'Turma A' },
    guardians: [],
    authorizedPickups: [],
    ...overrides,
  }
}

function mockChildRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'child-1',
    fullName: 'João Silva',
    schoolId: 'school-1',
    status: 'ATIVO',
    archivedAt: null,
    ...overrides,
  }
}

function mockGroup() {
  return { id: 'group-1' }
}

const SCHOOL_ID = 'school-1'
const CHILD_ID = 'child-1'

describe('Children Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── listChildren ──────────────────────────────────────────
  describe('listChildren', () => {
    it('admin lista todas as crianças da escola', async () => {
      const children = [mockChild(), mockChild({ id: 'child-2', fullName: 'Maria' })]
      vi.mocked(childrenRepository.listChildren).mockResolvedValue(children as any)

      const result = await listChildren(SCHOOL_ID, { role: 'ADMIN' })

      expect(result).toHaveLength(2)
      expect(childrenRepository.listChildren).toHaveBeenCalledWith(SCHOOL_ID)
    })

    it('responsável lista só crianças vinculadas', async () => {
      const children = [mockChild()]
      vi.mocked(childrenRepository.listChildrenForGuardianUser).mockResolvedValue(children as any)

      const result = await listChildren(SCHOOL_ID, { role: 'RESPONSAVEL', userId: 'guardian-1' })

      expect(result).toHaveLength(1)
      expect(childrenRepository.listChildrenForGuardianUser).toHaveBeenCalledWith(SCHOOL_ID, 'guardian-1')
    })

    it('responsável sem userId retorna array vazio', async () => {
      const result = await listChildren(SCHOOL_ID, { role: 'RESPONSAVEL' })

      expect(result).toEqual([])
      expect(childrenRepository.listChildrenForGuardianUser).not.toHaveBeenCalled()
      expect(childrenRepository.listChildren).not.toHaveBeenCalled()
    })
  })

  // ── createChild ───────────────────────────────────────────
  describe('createChild', () => {
    const validInput = {
      fullName: 'João Silva',
      birthDate: '2020-03-15',
      groupId: 'group-1',
      gender: 'MASCULINO' as const,
    }

    it('cria criança com dados válidos', async () => {
      vi.mocked(childrenRepository.findGroupById).mockResolvedValue(mockGroup() as any)
      vi.mocked(childrenRepository.createChild).mockResolvedValue(mockChild() as any)

      const result = await createChild(SCHOOL_ID, validInput)

      expect(result.id).toBe('child-1')
      expect(childrenRepository.findGroupById).toHaveBeenCalledWith(SCHOOL_ID, 'group-1')
      expect(childrenRepository.createChild).toHaveBeenCalledTimes(1)
    })

    it('cria criança sem groupId (não valida turma)', async () => {
      vi.mocked(childrenRepository.createChild).mockResolvedValue(mockChild() as any)

      const result = await createChild(SCHOOL_ID, { ...validInput, groupId: undefined })

      expect(result.id).toBe('child-1')
      expect(childrenRepository.findGroupById).not.toHaveBeenCalled()
    })

    it('lança erro 403 quando turma não pertence à escola', async () => {
      vi.mocked(childrenRepository.findGroupById).mockResolvedValue(null)

      await expect(createChild(SCHOOL_ID, { ...validInput, groupId: 'outra-escola-group' }))
        .rejects.toMatchObject({
          statusCode: 403,
          message: 'Turma nao encontrada para esta escola',
        })
    })

    it('formata birthDate como Date no input do repository', async () => {
      vi.mocked(childrenRepository.createChild).mockResolvedValue(mockChild() as any)

      await createChild(SCHOOL_ID, { ...validInput, groupId: undefined })

      const createData = vi.mocked(childrenRepository.createChild).mock.calls[0][0] as any
      expect(createData.birthDate).toBeInstanceOf(Date)
      expect(createData.schoolId).toBe(SCHOOL_ID)
      expect(createData.fullName).toBe('João Silva')
    })
  })

  // ── getChild ──────────────────────────────────────────────
  describe('getChild', () => {
    it('admin encontra criança por ID', async () => {
      vi.mocked(childrenRepository.findChildById).mockResolvedValue(mockChild() as any)

      const result = await getChild(SCHOOL_ID, CHILD_ID, { role: 'ADMIN' })

      expect(result.id).toBe(CHILD_ID)
      expect(childrenRepository.findChildById).toHaveBeenCalledWith(SCHOOL_ID, CHILD_ID)
    })

    it('responsável encontra criança vinculada', async () => {
      vi.mocked(childrenRepository.findChildByIdForGuardianUser)
        .mockResolvedValue(mockChild() as any)

      const result = await getChild(SCHOOL_ID, CHILD_ID, {
        role: 'RESPONSAVEL',
        userId: 'guardian-1',
      })

      expect(result.id).toBe(CHILD_ID)
      expect(childrenRepository.findChildByIdForGuardianUser)
        .toHaveBeenCalledWith(SCHOOL_ID, CHILD_ID, 'guardian-1')
    })

    it('lança erro 404 quando criança não encontrada', async () => {
      vi.mocked(childrenRepository.findChildById).mockResolvedValue(null)

      await expect(getChild(SCHOOL_ID, 'ghost-id', { role: 'ADMIN' }))
        .rejects.toMatchObject({
          statusCode: 404,
          message: 'Crianca nao encontrada',
        })
    })
  })

  // ── updateChild ───────────────────────────────────────────
  describe('updateChild', () => {
    it('atualiza criança com dados parciais', async () => {
      vi.mocked(childrenRepository.findGroupById).mockResolvedValue(mockGroup() as any)
      vi.mocked(childrenRepository.updateChild).mockResolvedValue(
        mockChild({ fullName: 'João Atualizado' }) as any,
      )

      const result = await updateChild(SCHOOL_ID, CHILD_ID, { fullName: 'João Atualizado' })

      expect(result.fullName).toBe('João Atualizado')
    })

    it('lança erro 403 quando turma não pertence à escola', async () => {
      vi.mocked(childrenRepository.findGroupById).mockResolvedValue(null)

      await expect(
        updateChild(SCHOOL_ID, CHILD_ID, { groupId: 'outra-escola' }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it('lança erro 404 quando update retorna null', async () => {
      vi.mocked(childrenRepository.updateChild).mockResolvedValue(null)

      await expect(
        updateChild(SCHOOL_ID, 'ghost-id', { fullName: 'Ninguém' }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Crianca nao encontrada',
      })
    })

    it('passa birthDate como Date para o repository', async () => {
      vi.mocked(childrenRepository.updateChild).mockResolvedValue(mockChild() as any)

      await updateChild(SCHOOL_ID, CHILD_ID, { birthDate: '2021-01-01' })

      const updateData = vi.mocked(childrenRepository.updateChild).mock.calls[0][2] as any
      expect(updateData.birthDate).toBeInstanceOf(Date)
    })

    it('passa exitDate como null quando explicitamente null para limpar', async () => {
      vi.mocked(childrenRepository.updateChild).mockResolvedValue(mockChild() as any)

      await updateChild(SCHOOL_ID, CHILD_ID, { exitDate: null as any })

      const updateData = vi.mocked(childrenRepository.updateChild).mock.calls[0][2] as any
      expect(updateData.exitDate).toBeNull()
    })
  })

  // ── deleteChild ───────────────────────────────────────────
  describe('deleteChild', () => {
    it('arquiva criança existente', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.archiveChild).mockResolvedValue(true)

      const result = await deleteChild(SCHOOL_ID, CHILD_ID)

      expect(result.success).toBe(true)
      expect(childrenRepository.archiveChild).toHaveBeenCalledWith(SCHOOL_ID, CHILD_ID)
    })

    it('lança erro 404 quando criança não existe', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(null)

      await expect(deleteChild(SCHOOL_ID, 'ghost-id'))
        .rejects.toMatchObject({
          statusCode: 404,
          message: 'Crianca nao encontrada',
        })
    })
  })

  // ── listGuardians ─────────────────────────────────────────
  describe('listGuardians', () => {
    it('admin lista responsáveis vinculados', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.listGuardians).mockResolvedValue([{ id: 'cg-1' }] as any)

      const result = await listGuardians(SCHOOL_ID, CHILD_ID, { role: 'ADMIN' })

      expect(result).toHaveLength(1)
    })

    it('responsável consegue ver responsáveis da criança vinculada', async () => {
      vi.mocked(childrenRepository.findChildRecordForGuardianUser)
        .mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.listGuardians).mockResolvedValue([])

      const result = await listGuardians(SCHOOL_ID, CHILD_ID, {
        role: 'RESPONSAVEL',
        userId: 'guardian-1',
      })

      expect(result).toEqual([])
      expect(childrenRepository.findChildRecordForGuardianUser)
        .toHaveBeenCalledWith(SCHOOL_ID, CHILD_ID, 'guardian-1')
    })

    it('lança erro 404 quando criança não encontrada', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(null)

      await expect(listGuardians(SCHOOL_ID, 'ghost-id', { role: 'ADMIN' }))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── listAuthorizedPickups ─────────────────────────────────
  describe('listAuthorizedPickups', () => {
    it('admin lista pessoas autorizadas', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.listAuthorizedPickups).mockResolvedValue([
        { id: 'ap-1', fullName: 'Carlos Silva' },
      ] as any)

      const result = await listAuthorizedPickups(SCHOOL_ID, CHILD_ID, { role: 'ADMIN' })

      expect(result).toHaveLength(1)
      expect(childrenRepository.listAuthorizedPickups).toHaveBeenCalledWith(CHILD_ID)
    })
  })

  // ── createAuthorizedPickup ────────────────────────────────
  describe('createAuthorizedPickup', () => {
    const validPickup = {
      fullName: 'Carlos Silva',
      relationship: 'Pai',
      phone: '11999999999',
    }

    it('cria pessoa autorizada vinculada à criança', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.createAuthorizedPickup).mockResolvedValue({
        id: 'ap-1',
        ...validPickup,
        childId: CHILD_ID,
      } as any)

      const result = await createAuthorizedPickup(SCHOOL_ID, CHILD_ID, validPickup)

      expect(result.childId).toBe(CHILD_ID)
    })

    it('lança erro 404 quando criança não existe', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(null)

      await expect(createAuthorizedPickup(SCHOOL_ID, 'ghost-id', validPickup))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('converte validUntil string para Date', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.createAuthorizedPickup).mockResolvedValue({} as any)

      await createAuthorizedPickup(SCHOOL_ID, CHILD_ID, {
        ...validPickup,
        validUntil: '2025-12-31',
      })

      const createData = vi.mocked(childrenRepository.createAuthorizedPickup).mock.calls[0][0] as any
      expect(createData.validUntil).toBeInstanceOf(Date)
    })
  })

  // ── deleteAuthorizedPickup ────────────────────────────────
  describe('deleteAuthorizedPickup', () => {
    it('remove pessoa autorizada', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.deleteAuthorizedPickup).mockResolvedValue(true)

      const result = await deleteAuthorizedPickup(SCHOOL_ID, CHILD_ID, 'person-1')

      expect(result.success).toBe(true)
    })

    it('lança erro 404 quando pessoa autorizada não encontrada', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.deleteAuthorizedPickup).mockResolvedValue(false)

      await expect(deleteAuthorizedPickup(SCHOOL_ID, CHILD_ID, 'ghost-person'))
        .rejects.toMatchObject({
          statusCode: 404,
          message: 'Pessoa autorizada nao encontrada',
        })
    })

    it('lança erro 404 quando criança não existe', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(null)

      await expect(deleteAuthorizedPickup(SCHOOL_ID, 'ghost-id', 'person-1'))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── listDocuments ─────────────────────────────────────────
  describe('listDocuments', () => {
    it('admin lista documentos da criança', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(mockChildRecord() as any)
      vi.mocked(childrenRepository.listDocuments).mockResolvedValue([
        { id: 'doc-1', name: 'RG.pdf' },
      ] as any)

      const result = await listDocuments(SCHOOL_ID, CHILD_ID, { role: 'ADMIN' })

      expect(result).toHaveLength(1)
      expect(childrenRepository.listDocuments).toHaveBeenCalledWith(CHILD_ID)
    })

    it('lança erro 404 quando criança não encontrada', async () => {
      vi.mocked(childrenRepository.findChildRecord).mockResolvedValue(null)

      await expect(listDocuments(SCHOOL_ID, 'ghost-id', { role: 'ADMIN' }))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
