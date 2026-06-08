import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { requireRole } from '../../middleware/requireRole'
import { AppError } from '../../shared/errors/AppError'

describe('requireRole middleware', () => {
  function makeReq(role?: string): Partial<Request> {
    return { user: role ? { sub: 'user-1', role } as any : undefined }
  }

  it('permite quando user tem a role exigida', () => {
    const req = makeReq('ADMIN')
    const next = vi.fn()
    const middleware = requireRole('ADMIN')

    middleware(req as Request, {} as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('permite quando user tem uma das roles (OR)', () => {
    const req = makeReq('PROFESSOR')
    const next = vi.fn()
    const middleware = requireRole('ADMIN', 'PROFESSOR', 'COORDENADOR')

    middleware(req as Request, {} as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('bloqueia quando user não tem a role', () => {
    const req = makeReq('RESPONSAVEL')
    const next = vi.fn()
    const middleware = requireRole('ADMIN')

    middleware(req as Request, {} as Response, next)

    const err = next.mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(403)
    expect(err.message).toContain('ADMIN')
  })

  it('bloqueia quando user não tem token (sem user no req)', () => {
    const req = makeReq(undefined)
    const next = vi.fn()
    const middleware = requireRole('ADMIN')

    middleware(req as Request, {} as Response, next)

    const err = next.mock.calls[0][0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(403)
  })

  it('mensagem lista todas as roles exigidas', () => {
    const req = makeReq('RESPONSAVEL')
    const next = vi.fn()
    const middleware = requireRole('ADMIN', 'FINANCEIRO')

    middleware(req as Request, {} as Response, next)

    const err = next.mock.calls[0][0] as AppError
    expect(err.message).toContain('ADMIN')
    expect(err.message).toContain('FINANCEIRO')
  })
})
