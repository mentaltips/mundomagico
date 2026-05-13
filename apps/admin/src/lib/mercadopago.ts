import { MercadoPagoConfig } from 'mercadopago'

// Singleton do cliente MP — usa o token global do .env
// Para multi-tenant com tokens por escola, passe o accessToken diretamente nas chamadas
export function getMpClient(accessToken?: string) {
  return new MercadoPagoConfig({
    accessToken: accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    options: { timeout: 5000 },
  })
}

// Formata valor em centavos para reais (MP usa reais com centavos como float)
export function toCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
