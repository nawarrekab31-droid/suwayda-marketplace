import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';
import { offerCreateSchema, offerUpdateSchema } from './offers.dto';

export const getOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, storeId, productId, isActive } = req.query;
    const where: any = {};

    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: { store: { select: { name: true } }, product: { select: { name: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.count({ where }),
    ]);

    res.json(successResponse(offers, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const getOfferById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { store: true, product: true },
    });
    if (!offer) throw new AppError('NOT_FOUND', 'العرض غير موجود', 404);
    res.json(successResponse(offer));
  } catch (err) {
    next(err);
  }
};

export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = offerCreateSchema.parse(req.body);
    const store = (req as any).store;
    const offer = await prisma.offer.create({
      data: { ...data, storeId: store.id },
    });
    res.status(201).json(successResponse(offer));
  } catch (err) {
    next(err);
  }
};

export const updateOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = offerUpdateSchema.parse(req.body);
    const offer = await prisma.offer.update({
      where: { id: req.params.id },
      data,
    });
    res.json(successResponse(offer));
  } catch (err) {
    next(err);
  }
};

export const deleteOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.offer.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json(successResponse({ message: 'تم تعطيل العرض' }));
  } catch (err) {
    next(err);
  }
};