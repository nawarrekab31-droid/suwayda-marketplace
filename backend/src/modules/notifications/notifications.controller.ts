import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, isRead } = req.query;
    const where: any = { userId: user.userId };
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json(successResponse(notifications, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) throw new AppError('NOT_FOUND', 'الإشعار غير موجود', 404);
    if (notification.userId !== user.userId) throw new AppError('FORBIDDEN', 'غير مصرح', 403);

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json(successResponse({ message: 'تم التحديث' }));
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json(successResponse({ message: 'تم تحديد الكل كمقروء' }));
  } catch (err) {
    next(err);
  }
};