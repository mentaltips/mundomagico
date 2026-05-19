import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hasPermission } from '../src/shared/middlewares/permissions.middleware'
import { invoiceWriteSchema, manualPaymentSchema } from '../src/shared/security/finance-policies'
import { isSameMoneyValue } from '../src/shared/security/payment-webhook-policy'
import { SECRET_MASK, maskSecret, schoolPublicSelect } from '../src/shared/security/school-secrets'

const root = resolve(__dirname, '..')

function readApiFile(path: string) {
  return readFileSync(resolve(root, path), 'utf8')
}

function assertDoesNotInclude(value: Record<string, unknown>, key: string) {
  assert.equal(Object.prototype.hasOwnProperty.call(value, key), false, `${key} should not pass schema parsing`)
}

function runFinancePolicyChecks() {
  const parsedInvoice = invoiceWriteSchema.parse({
    description: 'Mensalidade Maio',
    amount: '199.90',
    referenceMonth: '2026-05',
    status: 'PENDENTE',
    paidAmount: '199.90',
    paidAt: new Date().toISOString(),
    mpPaymentId: 'attacker-payment',
    mpPaymentStatus: 'approved',
    schoolId: 'attacker-school',
  })

  assert.equal(parsedInvoice.status, 'PENDENTE')
  assertDoesNotInclude(parsedInvoice, 'paidAmount')
  assertDoesNotInclude(parsedInvoice, 'paidAt')
  assertDoesNotInclude(parsedInvoice, 'mpPaymentId')
  assertDoesNotInclude(parsedInvoice, 'mpPaymentStatus')
  assertDoesNotInclude(parsedInvoice, 'schoolId')
  assert.throws(() => invoiceWriteSchema.parse({ status: 'PAGO' }))

  assert.equal(manualPaymentSchema.parse({ amount: '10.50' }).amount, '10.50')
  assert.throws(() => manualPaymentSchema.parse({ amount: -1 }))
  assert.throws(() => manualPaymentSchema.parse({ amount: '10.999' }))
}

function runWebhookPolicyChecks() {
  assert.equal(isSameMoneyValue('100.00', '100'), true)
  assert.equal(isSameMoneyValue(100, '100.004'), true)
  assert.equal(isSameMoneyValue('100.00', '99.98'), false)
  assert.equal(isSameMoneyValue(0, '100.00'), false)
}

function runPermissionChecks() {
  assert.equal(hasPermission('ADMIN', 'canSendWhatsapp'), true)
  assert.equal(hasPermission('RESPONSAVEL', 'canSendWhatsapp'), false)
  assert.equal(hasPermission(undefined, 'canSendWhatsapp'), false)
  assert.equal(hasPermission('FINANCEIRO', 'canManageFinance'), true)
  assert.equal(hasPermission('PROFESSOR', 'canManageFinance'), false)
}

function runRouteInvariantChecks() {
  const financeRoute = readApiFile('src/modules/finance/finance.routes.ts')
  assert.equal(financeRoute.includes('school: true'), false, 'finance route must not return full School with secrets')
  assert.match(financeRoute, /requirePermission\('canViewFinance'\)/)
  assert.match(financeRoute, /requirePermission\('canManageFinance'\)/)

  const financeRepository = readApiFile('src/modules/finance/finance.repository.ts')
  assert.equal(financeRepository.includes('school: true'), false, 'finance repository must not return full School with secrets')
  assert.match(financeRepository, /school: \{ select: schoolPublicSelect \}/)
  assert.match(financeRepository, /manualGatewayPaymentId = `MANUAL:\$\{invoice\.id\}`/)
  assert.match(financeRepository, /status: \{ not: 'PAGO' \}/)

  const financeController = readApiFile('src/modules/finance/finance.controller.ts')
  assert.match(financeController, /createInvoiceSchema\.parse/)
  assert.match(financeController, /updateInvoiceSchema\.parse/)

  const whatsappRoute = readApiFile('src/modules/whatsapp/whatsapp.routes.ts')
  assert.match(whatsappRoute, /router\.use\(requirePermission\('canSendWhatsapp'\)\)/)

  const whatsappRepository = readApiFile('src/modules/whatsapp/whatsapp.repository.ts')
  assert.match(whatsappRepository, /id,\s*\r?\n\s*schoolId,/)

  const whatsappService = readApiFile('src/modules/whatsapp/whatsapp.service.ts')
  assert.match(whatsappService, /requeueWhatsAppMessage\(id, schoolId\)/)

  const announcementsRoute = readApiFile('src/modules/announcements/announcements.routes.ts')
  assert.match(announcementsRoute, /sendWhatsApp && !hasPermission\(req\.user\?\.role, 'canSendWhatsapp'\)/)

  const webhooksRoute = readApiFile('src/modules/webhooks/webhooks.routes.ts')
  assert.equal(webhooksRoute.includes('include: { school: true }'), false, 'webhook route must not load full School secrets')
  assert.match(webhooksRoute, /router\.post\('\/mercadopago', webhooksController\.mercadoPago\)/)

  const webhooksRepository = readApiFile('src/modules/webhooks/payment-webhooks.repository.ts')
  assert.equal(webhooksRepository.includes('include: { school: true }'), false, 'webhook repository must not load full School secrets')
  assert.match(webhooksRepository, /mpAccessToken: true/)
  assert.match(webhooksRepository, /paymentId: payment\.id/)

  const webhooksService = readApiFile('src/modules/webhooks/payment-webhooks.service.ts')
  assert.match(webhooksService, /isSameMoneyValue\(amount, invoice\.amount\)/)
  assert.match(webhooksService, /error: 'Invoice already paid by another payment'/)

  const settingsRoute = readApiFile('src/modules/settings/settings.routes.ts')
  assert.equal(settingsRoute.includes("=== '••••••••'"), false, 'settings route should use shared SECRET_MASK')
  assert.match(settingsRoute, /requirePermission\('canManageSchoolSettings'\)/)

  const settingsService = readApiFile('src/modules/settings/settings.service.ts')
  assert.match(settingsService, /maskSecret\(school\.whatsappToken\)/)
  assert.match(settingsService, /maskSecret\(school\.smtpPass\)/)
  assert.match(settingsService, /maskSecret\(school\.mpAccessToken\)/)
  assert.match(settingsService, /maskSecret\(school\.mpPublicKey\)/)
  assert.match(settingsService, /isSecretMask\(value\)/)

  const cryptoUtil = readApiFile('src/shared/utils/crypto.ts')
  assert.match(cryptoUtil, /NODE_ENV === 'production'/)
  assert.match(cryptoUtil, /ENCRYPTION_KEY environment variable is required in production/)
}

runFinancePolicyChecks()
runWebhookPolicyChecks()
runPermissionChecks()
runRouteInvariantChecks()

assert.equal(SECRET_MASK, '••••••••')
assert.equal(maskSecret('secret'), SECRET_MASK)
assert.equal(maskSecret(null), null)
assert.equal(Object.prototype.hasOwnProperty.call(schoolPublicSelect, 'mpAccessToken'), false)
assert.equal(Object.prototype.hasOwnProperty.call(schoolPublicSelect, 'smtpPass'), false)

console.log('Security regression harness passed.')
