import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse, ApiResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const response: ApiResponse = errorResponse(
      'VALIDATION_ERROR',
      'بيانات غير صالحة',
      err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    );
    return res.status(400).json(response);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'الحقل';
      const response = errorResponse('DUPLICATE_ENTRY', `القيمة مكررة: ${target}`);
      return res.status(409).json(response);
    }
    if (err.code === 'P2025') {
      const response = errorResponse('NOT_FOUND', 'السجل غير موجود');
      return res.status(404).json(response);
    }
  }

  if (err instanceof AppError) {
    const response = errorResponse(err.code, err.message, err.details);
    return res.status(err.statusCode).json(response);
  }

  if (err.name === 'JsonWebTokenError') {
    const response = errorResponse('INVALID_TOKEN', 'رمز غير صالح أو منتهي الصلاحية');
    return res.status(401).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    const response = errorResponse('TOKEN_EXPIRED', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
    return res.status(401).json(response);
  }

  const response = errorResponse('INTERNAL_ERROR', 'حدث خطأ غير متوقع');
  return res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response) {
  const response = errorResponse('NOT_FOUND', `المسار غير موجود: ${req.method} ${req.path}`);
  return res.status(404).json(response);
}