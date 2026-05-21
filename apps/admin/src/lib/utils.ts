/**
 * Converte URLs do backend para caminhos seguros.
 * Resolve problemas de Mixed Content (HTTP vs HTTPS) e portas locais.
 */
export function getSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  // Se já for base64, ignora
  if (url.startsWith('data:')) return url

  // 1. Substitui localhost:3333 pela URL real da API
  let safeUrl = url.replace(/https?:\/\/localhost:\d+/, 'https://api.mundomagicocajamar.com.br')

  // 2. URLs absolutas da API com /uploads/ → proxy local (evita 401 do backend)
  const uploadsMatch = safeUrl.match(/https?:\/\/(?:api\.mundomagicocajamar\.com\.br|localhost:\d+)\/uploads\/(.+)/)
  if (uploadsMatch) {
    return `/api/uploads/${uploadsMatch[1]}`
  }

  // 3. Garante que se a URL começa com /upload ou /api/upload, ela aponte para o proxy local
  if (safeUrl.startsWith('/upload') || safeUrl.startsWith('/api/upload')) {
    if (!safeUrl.startsWith('/api/upload')) {
      safeUrl = `/api${safeUrl}`
    }
    return safeUrl
  }

  // 4. Garante que se a URL começa com /uploads, ela aponte para o proxy local
  if (safeUrl.startsWith('/uploads')) {
    safeUrl = `/api/uploads/${safeUrl.slice('/uploads/'.length)}`
    return safeUrl
  }

  // 5. Caminhos relativos que não são uploads - mantem como está
  if (safeUrl.startsWith('/')) return safeUrl

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

