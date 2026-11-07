import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';
import { productCreateSchema, productUpdateSchema } from './products.dto';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, categoryId, storeId, search, minPrice, maxPrice, isAvailable } = req.query;
    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (storeId) where.storeId = storeId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { store: { select: { name: true } }, images: true, category: { select: { name: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json(successResponse(products, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true, store: true, category: true, offers: { where: { isActive: true } } },
    });
    if (!product) throw new AppError('NOT_FOUND', 'المنتج غير موجود', 404);
    res.json(successResponse(product));
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = productCreateSchema.parse(req.body);
    const store = (req as any).store;
    const product = await prisma.product.create({
      data: { ...data, storeId: store.id },
    });
    res.status(201).json(successResponse(product));
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = productUpdateSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(successResponse(product));
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    res.json(successResponse({ message: 'تم الحذف (soft delete)' }));
  } catch (err) {
    next(err);
  }
};