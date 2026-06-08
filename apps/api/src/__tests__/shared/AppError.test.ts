import { describe, it, expect } from 'vitest'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'

describe('AppError', () => {
  it('cria erro com valores padrão', () => {
    const err = new AppError('Mensagem de erro')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
    expect(err.name).toBe('AppError')
    expect(err.message).toBe('Mensagem de erro')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR)
  })

  it('cria erro com status customizado', () => {
    const err = new AppError('Não autorizado', 401, ERROR_CODES.UNAUTHORIZED)
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe(ERROR_CODES.UNAUTHORIZED)
    expect(err.message).toBe('Não autorizado')
  })

  it('cria erro com details', () => {
    const err = new AppError('Erro com detalhes', 422, ERROR_CODES.VALIDATION_ERROR, {
      field: 'email',
      reason: 'Email já existe',
    })
    expect(err.details).toEqual({ field: 'email', reason: 'Email já existe' })
  })

  it('cria erro 500 internal server', () => {
    const err = new AppError('Erro interno', 500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR)
  })

  it('cria erro 404 not found', () => {
    const err = new AppError('Recurso não encontrado', 404, ERROR_CODES.NOT_FOUND)
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND)
  })

  it('cria erro 409 conflict', () => {
    const err = new AppError('Recurso duplicado', 409, ERROR_CODES.FORBIDDEN)
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe(ERROR_CODES.FORBIDDEN)
  })
})

describe('ERROR_CODES', () => {
  it('todos os error codes são strings definidas', () => {
    const codes = Object.values(ERROR_CODES)
    expect(codes.length).toBeGreaterThan(0)
    codes.forEach((code) => {
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
    })
  })

  it('error codes principais existem', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBeDefined()
    expect(ERROR_CODES.NOT_FOUND).toBeDefined()
    expect(ERROR_CODES.VALIDATION_ERROR).toBeDefined()
    expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBeDefined()
    expect(ERROR_CODES.FORBIDDEN).toBeDefined()
  })
})
