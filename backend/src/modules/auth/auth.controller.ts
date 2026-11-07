import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { hashPassword, verifyPassword } from '../../common/utils/password';
import { generateAccessToken, generateRefreshToken } from '../../common/utils/jwt';
import { loginSchema, merchantRegisterSchema, refreshTokenSchema } from './auth.dto';
import { AppError } from '../../common/middleware/errorHandler';
import { successResponse } from '../../common/utils/response';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw new AppError('INVALID_CREDENTIALS', 'رقم الهاتف أو كلمة المرور غير صحيحة', 401);
    }

    if (!user.isActive) {
      throw new AppError('ACCOUNT_SUSPENDED', 'حسابك معلق', 403);
    }

    const payload = { userId: user.id, phone: user.phone, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json(successResponse({ accessToken, refreshToken, user: { name: user.name, role: user.role } }));
  } catch (err) {
    next(err);
  }
};

export const registerMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = merchantRegisterSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);

    const merchant = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          passwordHash,
          role: 'MERCHANT',
        },
      });

      await tx.store.create({
        data: {
          ownerUserId: user.id,
          name: data.storeName,
          description: data.storeDescription,
          address: data.storeAddress,
          phone: data.storePhone,
          workingHours: {
            open: '09:00',
            close: '21:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          },
          status: 'PENDING',
        },
      });

      return user;
    });

    res.status(201).json(successResponse({ id: merchant.id, name: merchant.name }));
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const { generateAccessToken } = await import('../../common/utils/jwt');
    const payload = await import('../../common/utils/jwt').then(m => m.verifyRefreshToken(refreshToken));
    const accessToken = generateAccessToken(payload);
    res.json(successResponse({ accessToken }));
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'المستخدم غير موجود', 404);
    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      throw new AppError('INVALID_CREDENTIALS', 'كلمة المرور الحالية غير صحيحة', 401);
    }
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    res.json(successResponse({ message: 'تم تحديث كلمة المرور' }));
  } catch (err) {
    next(err);
  }
};