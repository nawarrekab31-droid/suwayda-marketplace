import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken, JwtPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import { prisma } from '../../prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  store?: any;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'مطلوب تسجيل الدخول', 401);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    throw new AppError('INVALID_TOKEN', 'رمز غير صالح أو منتهي الصلاحية', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'مطلوب تسجيل الدخول', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'غير مصرح بالوصول', 403);
    }
    next();
  };
}

export async function requireStoreOwnership(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'MERCHANT') {
    throw new AppError('FORBIDDEN', 'مخصص للتجار فقط', 403);
  }

  const store = await prisma.store.findFirst({
    where: { ownerUserId: req.user.userId },
  });

  if (!store) {
    throw new AppError('NOT_FOUND', 'لا يوجد متجر مرتبط بحسابك', 404);
  }

  if (store.status !== 'ACTIVE') {
    throw new AppError('FORBIDDEN', 'متجرك غير نشط', 403);
  }

  req.store = store;
  next();
}

export async function requireOrderOwnership(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED', 'مطلوب تسجيل الدخول', 401);
  }

  const orderId = req.params.id || req.params.orderId;
  if (!orderId) {
    throw new AppError('BAD_REQUEST', 'معرف الطلب مطلوب', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, storeId: true },
  });

  if (!order) {
    throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);
  }

  const isCustomer = req.user.role === 'CUSTOMER' && order.customerId === req.user.userId;
  let isMerchant = false;
  if (req.user.role === 'MERCHANT' && order.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: order.storeId },
      select: { ownerUserId: true },
    });
    isMerchant = store?.ownerUserId === req.user.userId;
  }

  if (!isCustomer && !isMerchant && req.user.role !== 'ADMIN') {
    throw new AppError('FORBIDDEN', 'غير مصرح بالوصول لهذا الطلب', 403);
  }

  next();
}