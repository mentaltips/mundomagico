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

/**
 * Extrai uma mensagem de erro amigável de qualquer objeto de erro retornado pela API ou exceção.
 * Evita o crash de passar um objeto direto para o toast.error.
 */
export function getErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback
  if (typeof err === 'string') return err

  // Extrai o erro aninhado se houver
  let target = err
  if (err.error) {
    target = err.error
  }

  if (typeof target === 'string') return target

  if (target && typeof target === 'object') {
    if (target.message && typeof target.message === 'string') {
      return target.message
    }

    // Detalhes do erro Zod do middleware da API (errorMiddleware)
    if (target.details && typeof target.details === 'object') {
      const details = target.details
      if (details.fieldErrors && typeof details.fieldErrors === 'object') {
        const errors = Object.entries(details.fieldErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ')
        if (errors) return `Dados inválidos - ${errors}`
      }
    }

    // Erros diretos do Zod format (usado em controllers com bodyParsed.error.format())
    if (target._errors || Object.keys(target).some(k => k !== 'message' && target[k]?._errors)) {
      const fieldErrors = Object.entries(target)
        .filter(([k]) => k !== '_errors')
        .map(([field, val]: [string, any]) => {
          const msgs = val?._errors
          return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : ''}`
        })
        .filter(s => !s.endsWith(': '))
        .join(' | ')
      if (fieldErrors) return `Erro nos campos - ${fieldErrors}`
    }
  }

  if (err.message && typeof err.message === 'string') return err.message

  return fallback
}

