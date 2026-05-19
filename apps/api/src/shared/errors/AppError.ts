import { ERROR_CODES, type ErrorCode } from './error-codes'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode = 400,
    code: ErrorCode = ERROR_CODES.VALIDATION_ERROR,
    details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}
