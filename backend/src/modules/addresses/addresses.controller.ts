import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';
import { addressCreateSchema, addressUpdateSchema } from './addresses.dto';

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(addresses));
  } catch (err) {
    next(err);
  }
};

export const getAddressById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!address) throw new AppError('NOT_FOUND', 'العنوان غير موجود', 404);
    res.json(successResponse(address));
  } catch (err) {
    next(err);
  }
};

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const data = addressCreateSchema.parse(req.body);
    const address = await prisma.address.create({
      data: { userId, ...data },
    });
    res.status(201).json(successResponse(address));
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const data = addressUpdateSchema.parse(req.body);
    const address = await prisma.address.updateMany({
      where: { id: req.params.id, userId },
      data,
    });
    if (address.count === 0) throw new AppError('NOT_FOUND', 'العنوان غير موجود', 404);
    const updated = await prisma.address.findUnique({ where: { id: req.params.id } });
    res.json(successResponse(updated));
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const address = await prisma.address.deleteMany({
      where: { id: req.params.id, userId },
    });
    if (address.count === 0) throw new AppError('NOT_FOUND', 'العنوان غير موجود', 404);
    res.json(successResponse({ message: 'تم حذف العنوان' }));
  } catch (err) {
    next(err);
  }
};