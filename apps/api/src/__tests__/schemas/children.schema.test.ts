import { describe, it, expect } from 'vitest'
import {
  createChildSchema,
  updateChildSchema,
  childIdParamsSchema,
  createAuthorizedPickupSchema,
} from '../../modules/children/children.schema'

const validChild = {
  fullName: 'João Silva',
  birthDate: '2020-03-15',
}

describe('Children Schemas — validação Zod', () => {
  // ── createChildSchema ────────────────────────────────────
  describe('createChildSchema', () => {
    it('aceita dados mínimos válidos (nome + data)', () => {
      const result = createChildSchema.safeParse(validChild)
      expect(result.success).toBe(true)
    })

    it('aceita dados completos válidos', () => {
      const result = createChildSchema.safeParse({
        fullName: 'Maria Santos',
        birthDate: '2019-06-01',
        nickname: 'Mari',
        gender: 'FEMININO',
        shift: 'INTEGRAL',
        status: 'ATIVO',
        bloodType: 'O+',
        allergies: 'Nenhuma',
        usesDiapers: false,
        usesBottle: true,
        monthlyFee: 150,
        dueDay: 5,
      })
      expect(result.success).toBe(true)
    })

    it('default: shift é MANHA quando não informado', () => {
      const result = createChildSchema.safeParse(validChild)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift).toBe('MANHA')
      }
    })

    it('default: status é ATIVO quando não informado', () => {
      const result = createChildSchema.safeParse(validChild)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('ATIVO')
      }
    })

    it('rejeita nome menor que 2 caracteres', () => {
      const result = createChildSchema.safeParse({ ...validChild, fullName: 'A' })
      expect(result.success).toBe(false)
    })

    it('rejeita nome maior que 180 caracteres', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        fullName: 'A'.repeat(181),
      })
      expect(result.success).toBe(false)
    })

    it('rejeita data de nascimento inválida', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        birthDate: 'data-invalida',
      })
      expect(result.success).toBe(false)
    })

    it('aceita birthDate formato ISO 8601 com timezone', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        birthDate: '2020-03-15T10:30:00-03:00',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita gender inválido', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        gender: 'INVALIDO',
      })
      expect(result.success).toBe(false)
    })

    it('aceita gender válido: MASCULINO, FEMININO, OUTRO', () => {
      for (const gender of ['MASCULINO', 'FEMININO', 'OUTRO']) {
        const result = createChildSchema.safeParse({ ...validChild, gender })
        expect(result.success).toBe(true)
      }
    })

    it('rejeita shift inválido', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        shift: 'MEIO_PERIODO',
      })
      expect(result.success).toBe(false)
    })

    it('aceita todos os shifts válidos', () => {
      for (const shift of ['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']) {
        const result = createChildSchema.safeParse({ ...validChild, shift })
        expect(result.success).toBe(true)
      }
    })

    it('rejeita status inválido', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        status: 'EXPULSO',
      })
      expect(result.success).toBe(false)
    })

    it('aceita todos os status válidos', () => {
      const statuses = ['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO', 'PENDENTE_PAGAMENTO']
      for (const status of statuses) {
        const result = createChildSchema.safeParse({ ...validChild, status })
        expect(result.success).toBe(true)
      }
    })

    it('rejeita dueDay menor que 1', () => {
      const result = createChildSchema.safeParse({ ...validChild, dueDay: 0 })
      expect(result.success).toBe(false)
    })

    it('rejeita dueDay maior que 28', () => {
      const result = createChildSchema.safeParse({ ...validChild, dueDay: 29 })
      expect(result.success).toBe(false)
    })

    it('aceita monthlyFee como string numérica', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        monthlyFee: '200.50',
      })
      expect(result.success).toBe(true)
    })

    it('aceita monthlyFee como número', () => {
      const result = createChildSchema.safeParse({
        ...validChild,
        monthlyFee: 200.5,
      })
      expect(result.success).toBe(true)
    })

    it('rejeita campos obrigatórios faltantes', () => {
      const result = createChildSchema.safeParse({ fullName: 'João' }) // falta birthDate
      expect(result.success).toBe(false)
    })
  })

  // ── updateChildSchema (partial) ──────────────────────────
  describe('updateChildSchema', () => {
    it('permite objeto vazio (todos campos opcionais)', () => {
      const result = updateChildSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('permite atualização parcial (só nome)', () => {
      const result = updateChildSchema.safeParse({ fullName: 'Novo Nome' })
      expect(result.success).toBe(true)
    })
  })

  // ── childIdParamsSchema ──────────────────────────────────
  describe('childIdParamsSchema', () => {
    it('aceita id válido', () => {
      const result = childIdParamsSchema.safeParse({ id: 'child-123' })
      expect(result.success).toBe(true)
    })

    it('rejeita id vazio', () => {
      const result = childIdParamsSchema.safeParse({ id: '' })
      expect(result.success).toBe(false)
    })

    it('rejeita id maior que 128 caracteres', () => {
      const result = childIdParamsSchema.safeParse({ id: 'x'.repeat(129) })
      expect(result.success).toBe(false)
    })
  })

  // ── createAuthorizedPickupSchema ─────────────────────────
  describe('createAuthorizedPickupSchema', () => {
    const validPickup = {
      fullName: 'Carlos Silva',
      relationship: 'Pai',
      phone: '11999999999',
    }

    it('aceita dados mínimos válidos', () => {
      const result = createAuthorizedPickupSchema.safeParse(validPickup)
      expect(result.success).toBe(true)
    })

    it('default: authorization é SIM', () => {
      const result = createAuthorizedPickupSchema.safeParse(validPickup)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.authorization).toBe('SIM')
      }
    })

    it('rejeita nome menor que 2 caracteres', () => {
      const result = createAuthorizedPickupSchema.safeParse({
        ...validPickup,
        fullName: 'A',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita sem telefone', () => {
      const result = createAuthorizedPickupSchema.safeParse({
        fullName: 'Carlos Silva',
        relationship: 'Pai',
      })
      expect(result.success).toBe(false)
    })

    it('aceita authorization válido: SIM, NAO, TEMPORARIO', () => {
      for (const auth of ['SIM', 'NAO', 'TEMPORARIO']) {
        const result = createAuthorizedPickupSchema.safeParse({ ...validPickup, authorization: auth })
        expect(result.success).toBe(true)
      }
    })
  })
})
