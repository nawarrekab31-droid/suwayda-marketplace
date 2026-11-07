import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(successResponse(categories));
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { children: true, parent: true },
    });
    if (!category) throw new AppError('NOT_FOUND', 'التصنيف غير موجود', 404);
    res.json(successResponse(category));
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, icon, parentId } = req.body;
    const category = await prisma.category.create({ data: { name, icon, parentId } });
    res.status(201).json(successResponse(category));
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, icon } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, icon },
    });
    res.json(successResponse(category));
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json(successResponse({ message: 'تم الحذف' }));
  } catch (err) {
    next(err);
  }
};