import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { requireApiAuth } from '../../middleware/auth'
import { AppError } from '../../shared/errors/AppError'

describe('requireApiAuth middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    vi.restoreAllMocks()
    req = { headers: {} }
    res = {}
    next = vi.fn()
  })

  it('chama next() com token válido', () => {
    const secret = 'test-secret'
    vi.stubEnv('JWT_SECRET', secret)
    const token = jwt.sign({ sub: 'user-1', role: 'admin' }, secret)

    req.headers = { authorization: `Bearer ${token}` }

    requireApiAuth(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user).toBeDefined()
    expect(req.user?.sub).toBe('user-1')
    expect(req.user?.role).toBe('admin')
  })

  it('passa AppError 401 quando header Authorization está ausente', () => {
    requireApiAuth(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
    expect(err.message).toContain('Token de autenticacao nao fornecido')
  })

  it('passa AppError 401 quando token não começa com Bearer', () => {
    req.headers = { authorization: 'Basic abc123' }

    requireApiAuth(req as Request, res as Response, next)

    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('passa AppError 500 quando JWT_SECRET não está definido', () => {
    vi.stubEnv('JWT_SECRET', undefined)
    req.headers = { authorization: 'Bearer some-token' }

    requireApiAuth(req as Request, res as Response, next)

    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(500)
    expect(err.message).toContain('Erro de configuracao')
  })

  it('passa AppError 401 quando token é inválido (assinatura errada)', () => {
    vi.stubEnv('JWT_SECRET', 'correct-secret')
    const wrongToken = jwt.sign({ sub: 'user-1' }, 'wrong-secret')

    req.headers = { authorization: `Bearer ${wrongToken}` }

    requireApiAuth(req as Request, res as Response, next)

    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
    expect(err.message).toContain('Token invalido')
  })

  it('passa AppError 401 quando token está expirado', () => {
    const secret = 'test-secret'
    vi.stubEnv('JWT_SECRET', secret)
    const expiredToken = jwt.sign({ sub: 'user-1' }, secret, { expiresIn: '0s' })

    req.headers = { authorization: `Bearer ${expiredToken}` }

    requireApiAuth(req as Request, res as Response, next)

    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('passa AppError 401 quando header Authorization é string vazia', () => {
    req.headers = { authorization: '' }

    requireApiAuth(req as Request, res as Response, next)

    const err = (next as any).mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })
})
