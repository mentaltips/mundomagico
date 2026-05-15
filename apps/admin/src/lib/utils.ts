/**
 * Converte URLs do backend para caminhos seguros via proxy.
 * Resolve problemas de Mixed Content (HTTP vs HTTPS) e portas locais.
 */
export function getSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  // Se já for um caminho relativo ou base64, ignora
  if (url.startsWith('/') || url.startsWith('data:')) return url

  // 1. Substitui localhost:3333 ou localhost:3002 pelo prefixo de proxy local /api
  let safeUrl = url.replace(/https?:\/\/localhost:\d+/, '/api')

  // 2. Substitui a URL real do servidor de API pelo prefixo de proxy /api
  // Isso evita erros de Mixed Content (carregar HTTP dentro de HTTPS)
  safeUrl = safeUrl.replace(/https?:\/\/api\.mundomagicocajamar\.com\.br/, '/api')

  // 3. Garante que se a URL começa com /uploads, ela passe pelo /api/uploads
  if (safeUrl.startsWith('/uploads')) {
    safeUrl = `/api${safeUrl}`
  }

  return safeUrl
}
