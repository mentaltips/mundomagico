import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError'
import { ERROR_CODES } from '../errors/error-codes'

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    })
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Dados invalidos',
        statusCode: 400,
        details: error.flatten(),
      },
    })
  }

  req.log?.error(error)

  return res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      statusCode: 500,
    },
  })
}
