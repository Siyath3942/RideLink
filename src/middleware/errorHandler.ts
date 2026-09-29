import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp,
    });
    return;
  }

  // Custom App Errors (Domain / Business Logic / Auth / Not Found)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || null,
      },
      timestamp,
    });
    return;
  }

  // Prisma unique constraint error (e.g. unique license number or vehicle registration)
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A record with this ${target} already exists.`,
        details: err.meta || null,
      },
      timestamp,
    });
    return;
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Requested record was not found.',
      },
      timestamp,
    });
    return;
  }

  // Generic Internal Server Error (Hide stack traces in response)
  console.error('[Unhandled Exception]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please try again later.',
    },
    timestamp,
  });
}
