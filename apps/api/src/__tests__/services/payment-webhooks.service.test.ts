import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as paymentWebhookRepository from '../../modules/webhooks/payment-webhooks.repository'
import { processMercadoPagoWebhook } from '../../modules/webhooks/payment-webhooks.service'

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../../modules/webhooks/payment-webhooks.repository')
vi.mock('../../shared/utils/crypto', () => ({ decrypt: vi.fn(() => 'decrypted-mp-token') }))
vi.mock('../../shared/security/payment-webhook-policy', () => ({
  isSameMoneyValue: vi.fn((a: number, b: number) => a === b),
}))
vi.mock('mercadopago', () => {
  const mockGet = vi.fn()
  function MockPayment() {
    this.get = mockGet
  }
  return {
    MercadoPagoConfig: vi.fn(),
    Payment: MockPayment,
    __mockGet: mockGet,
  }
})

import { Payment } from 'mercadopago'
import { isSameMoneyValue } from '../../shared/security/payment-webhook-policy'
import { decrypt } from '../../shared/utils/crypto'

// ─── Helpers ────────────────────────────────────────────────
function mockWebhookEvent(id = 'we-1') {
  return {
    id,
    gateway: 'MERCADO_PAGO',
    eventType: 'payment',
    externalId: 'mp-123',
    rawPayload: {},
    status: 'PENDING',
    schoolId: null,
    invoiceId: null,
    paymentId: null,
    error: null,
    processedAt: null,
    createdAt: new Date(),
  }
}

function mockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    schoolId: 'school-1',
    amount: 150.0,
    status: 'PENDENTE',
    school: {
      integrationSecret: { mpAccessToken: 'encrypted-token' },
    },
    ...overrides,
  }
}

const mpPaymentApproved = {
  id: 123,
  status: 'approved',
  transaction_amount: 150.0,
  payment_method_id: 'pix',
}

describe('Payment Webhooks Service — processMercadoPagoWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(decrypt).mockReturnValue('decrypted-mp-token')
  })

  // ── Tratamento de event type inválido ─────────────────────
  describe('event types não suportados', () => {
    it('ignora evento que não é do tipo payment', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      await processMercadoPagoWebhook({ type: 'merchant_order', data: { id: 'mo-1' } })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({ status: 'IGNORED' }),
      )
    })

    it('marca como FAILED quando não tem paymentId', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      await processMercadoPagoWebhook({ type: 'payment', data: {} })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({ status: 'FAILED' }),
      )
    })
  })

  // ── Idempotência ──────────────────────────────────────────
  describe('idempotência', () => {
    it('ignora evento duplicado já processado', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent)
        .mockResolvedValue({ id: 'we-old', externalId: 'mp-123', status: 'PROCESSED' } as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({ status: 'IGNORED', error: 'Duplicate processed webhook event' }),
      )
    })
  })

  // ── Invoice não encontrada ────────────────────────────────
  describe('invoice não encontrada', () => {
    it('ignora quando invoice não existe', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.findInvoiceForMercadoPagoPayment)
        .mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({
          status: 'IGNORED',
          error: 'Invoice not found for Mercado Pago payment',
        }),
      )
    })
  })

  // ── Fluxo completo de pagamento aprovado ──────────────────
  describe('pagamento aprovado', () => {
    it('processa pagamento aprovado com sucesso', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.findInvoiceForMercadoPagoPayment)
        .mockResolvedValue(mockInvoice() as any)

      // Mock MercadoPago SDK — todas instâncias compartilham o mesmo mockGet
      const mpInstance = new (Payment as any)()
      vi.mocked(mpInstance.get).mockResolvedValue(mpPaymentApproved)

      vi.mocked(isSameMoneyValue).mockReturnValue(true)
      vi.mocked(paymentWebhookRepository.findPaymentByGatewayId).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.applyApprovedMercadoPagoPayment)
        .mockResolvedValue({} as any)

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.applyApprovedMercadoPagoPayment)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            externalId: 'mp-123',
            mpStatus: 'approved',
            amount: 150.0,
          }),
        )
    })
  })

  // ── Status não aprovado ───────────────────────────────────
  describe('status não aprovado', () => {
    it('ignora pagamento com status pending', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.findInvoiceForMercadoPagoPayment)
        .mockResolvedValue(mockInvoice() as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)
      vi.mocked(paymentWebhookRepository.updateInvoiceMercadoPagoStatusForSchool)
        .mockResolvedValue({} as any)

      const mpPaymentInstance = new (Payment as any)()
      vi.mocked(mpPaymentInstance.get).mockResolvedValue({
        id: 123,
        status: 'pending',
        transaction_amount: 150.0,
      })

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.updateInvoiceMercadoPagoStatusForSchool)
        .toHaveBeenCalledWith('inv-1', 'school-1', 'pending')
    })
  })

  // ── Divergência de valor ──────────────────────────────────
  describe('divergência de valor', () => {
    it('rejeita pagamento com valor diferente da invoice', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.findInvoiceForMercadoPagoPayment)
        .mockResolvedValue(mockInvoice() as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      const mpPaymentInstance = new (Payment as any)()
      vi.mocked(mpPaymentInstance.get).mockResolvedValue({
        id: 123,
        status: 'approved',
        transaction_amount: 999.99, // diferente de 150.00
      })

      vi.mocked(isSameMoneyValue).mockReturnValue(false)

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({
          status: 'FAILED',
          error: expect.stringContaining('Amount mismatch'),
        }),
      )
    })
  })

  // ── Invoice já paga por outro pagamento ───────────────────
  describe('invoice já paga', () => {
    it('rejeita quando invoice já está PAGA sem payment gateway', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)
      vi.mocked(paymentWebhookRepository.findProcessedEvent).mockResolvedValue(null)
      vi.mocked(paymentWebhookRepository.findInvoiceForMercadoPagoPayment)
        .mockResolvedValue(mockInvoice({ status: 'PAGO' }) as any)
      vi.mocked(paymentWebhookRepository.updateWebhookEvent)
        .mockResolvedValue({} as any)

      const mpPaymentInstance = new (Payment as any)()
      vi.mocked(mpPaymentInstance.get).mockResolvedValue(mpPaymentApproved)
      vi.mocked(isSameMoneyValue).mockReturnValue(true)
      vi.mocked(paymentWebhookRepository.findPaymentByGatewayId)
        .mockResolvedValue(null)

      await processMercadoPagoWebhook({
        type: 'payment',
        data: { id: 'mp-123' },
      })

      expect(paymentWebhookRepository.updateWebhookEvent).toHaveBeenCalledWith(
        'we-1',
        expect.objectContaining({
          status: 'FAILED',
          error: 'Invoice already paid by another payment',
        }),
      )
    })
  })

  // ── Uso de queryPaymentId como fallback ───────────────────
  describe('queryPaymentId como fallback', () => {
    it('usa queryPaymentId quando data.id está ausente', async () => {
      vi.mocked(paymentWebhookRepository.createWebhookEvent)
        .mockResolvedValue(mockWebhookEvent() as any)

      await processMercadoPagoWebhook({ type: 'not-payment' as any }, 'mp-from-query')

      expect(paymentWebhookRepository.createWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({ externalId: 'mp-from-query' }),
      )
    })
  })
})
