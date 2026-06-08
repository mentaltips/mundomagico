import { describe, it, expect } from 'vitest'
import { mercadoPagoWebhookSchema } from '../../modules/webhooks/webhooks.schema'

describe('Webhooks Schemas — validação Zod', () => {
  describe('mercadoPagoWebhookSchema', () => {
    it('aceita payload mínimo (objeto vazio)', () => {
      const result = mercadoPagoWebhookSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('aceita payload completo do MercadoPago', () => {
      const payload = {
        action: 'payment.updated',
        api_version: 'v1',
        data: { id: '123456789' },
        date_created: '2025-01-01T10:00:00Z',
        id: 987654321,
        live_mode: true,
        type: 'payment',
        user_id: '12345',
      }
      const result = mercadoPagoWebhookSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('aceita data.id como string', () => {
      const result = mercadoPagoWebhookSchema.safeParse({
        data: { id: 'payment-123' },
      })
      expect(result.success).toBe(true)
    })

    it('aceita data.id como número', () => {
      const result = mercadoPagoWebhookSchema.safeParse({
        data: { id: 123456789 },
      })
      expect(result.success).toBe(true)
    })

    it('aceita sem o campo type', () => {
      const result = mercadoPagoWebhookSchema.safeParse({
        data: { id: '123' },
      })
      expect(result.success).toBe(true)
    })

    it('aceita sem o campo data', () => {
      const result = mercadoPagoWebhookSchema.safeParse({
        type: 'payment',
      })
      expect(result.success).toBe(true)
    })

    it('aceita campos extra via passthrough', () => {
      const result = mercadoPagoWebhookSchema.safeParse({
        action: 'payment.created',
        campo_extra_inesperado: 'valor',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('campo_extra_inesperado')
      }
    })
  })
})
