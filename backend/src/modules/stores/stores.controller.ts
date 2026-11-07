import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';
import { storeCreateSchema, storeUpdateSchema, storeApproveSchema } from './stores.dto';

export const getAllStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where: any = status ? { status: status as any } : {};

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: { owner: { select: { name: true, phone: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.store.count({ where }),
    ]);

    res.json(successResponse(stores, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const getStoreById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { name: true, phone: true, email: true } } },
    });
    if (!store) throw new AppError('NOT_FOUND', 'المتجر غير موجود', 404);
    res.json(successResponse(store));
  } catch (err) {
    next(err);
  }
};

export const createStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = storeCreateSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const store = await prisma.store.create({
      data: { ...data, ownerUserId: userId },
    });
    res.status(201).json(successResponse(store));
  } catch (err) {
    next(err);
  }
};

export const updateStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = storeUpdateSchema.parse(req.body);
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data,
    });
    res.json(successResponse(store));
  } catch (err) {
    next(err);
  }
};

export const approveStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = storeApproveSchema.parse(req.body);
    const statusMap: Record<string, any> = { approve: 'ACTIVE', suspend: 'SUSPENDED', reject: 'PENDING' };
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: { status: statusMap[action] },
    });
    res.json(successResponse(store));
  } catch (err) {
    next(err);
  }
};

export const getMyStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const store = await prisma.store.findFirst({ where: { ownerUserId: userId } });
    if (!store) throw new AppError('NOT_FOUND', 'لا يوجد متجر مرتبط بحسابك', 404);
    res.json(successResponse(store));
  } catch (err) {
    next(err);
  }
};