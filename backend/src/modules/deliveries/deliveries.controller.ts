import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

export const getMyDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'DRIVER') throw new AppError('FORBIDDEN', 'للسائقين فقط', 403);

    const driver = await prisma.driver.findUnique({ where: { userId: user.userId } });
    if (!driver) throw new AppError('NOT_FOUND', 'ملف السائق غير موجود', 404);

    const { page = 1, limit = 20, status } = req.query;
    const where: any = { driverId: driver.id };
    if (status) where.status = status;

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          order: {
            include: {
              customer: { select: { name: true, phone: true } },
              store: { select: { name: true, address: true, phone: true } },
              addressSnapshot: true,
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.delivery.count({ where }),
    ]);

    res.json(successResponse(deliveries, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'DRIVER') throw new AppError('FORBIDDEN', 'للسائقين فقط', 403);

    const { status, failReason } = req.body;
    const deliveryId = req.params.id;

    const driver = await prisma.driver.findUnique({ where: { userId: user.userId } });
    if (!driver) throw new AppError('NOT_FOUND', 'ملف السائق غير موجود', 404);

    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new AppError('NOT_FOUND', 'التوصيل غير موجود', 404);
    if (delivery.driverId !== driver.id) throw new AppError('FORBIDDEN', 'ليس لك صلاحية', 403);

    const VALID_DELIVERY_TRANSITIONS: Record<string, string[]> = {
      ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['DELIVERED', 'FAILED'],
      DELIVERED: [],
      FAILED: [],
    };

    const allowedNext = VALID_DELIVERY_TRANSITIONS[delivery.status] || [];
    if (!allowedNext.includes(status)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `لا يمكن تغيير الحالة من ${delivery.status} إلى ${status}`,
        400
      );
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const data: any = { status };

      if (status === 'PICKED_UP') {
        data.pickedAt = now;
      } else if (status === 'DELIVERED') {
        data.deliveredAt = now;
      } else if (status === 'FAILED') {
        data.failedAt = now;
        data.failReason = failReason || 'سبب غير مُحدد';
      }

      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data,
      });

      let newOrderStatus: string | null = null;
      if (status === 'PICKED_UP') newOrderStatus = 'ON_THE_WAY';
      else if (status === 'DELIVERED') newOrderStatus = 'DELIVERED';
      else if (status === 'FAILED') newOrderStatus = 'DELIVERY_FAILED';

      if (newOrderStatus) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: newOrderStatus as any },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: delivery.orderId,
            status: newOrderStatus as any,
            changedBy: user.userId,
            note: status === 'PICKED_UP' ? 'في طريق التوصيل'
              : status === 'DELIVERED' ? 'تم التوصيل'
              : 'فشل التوصيل',
          },
        });
      }

      return updatedDelivery;
    });

    res.json(successResponse(updated));
  } catch (err) {
    next(err);
  }
};

export const getDeliveryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: { select: { name: true, phone: true } },
            store: { select: { name: true, address: true, phone: true } },
            addressSnapshot: true,
            items: true,
          },
        },
        driver: true,
      },
    });
    if (!delivery) throw new AppError('NOT_FOUND', 'التوصيل غير موجود', 404);
    res.json(successResponse(delivery));
  } catch (err) {
    next(err);
  }
};

export const assignDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new AppError('FORBIDDEN', 'للوحة إدارة فقط', 403);

    const { driverId, orderId } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new AppError('NOT_FOUND', 'الساق غير موجود', 404);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);

    const existing = await prisma.delivery.findFirst({ where: { orderId } });
    if (existing) throw new AppError('CONFLICT', 'هذا الطلب تمت توزيعه بالفعل', 409);

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        driverId,
        status: 'ASSIGNED',
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ASSIGNED_TO_DRIVER' },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'ASSIGNED_TO_DRIVER',
        changedBy: user.userId,
        note: 'تم تعيين سائق',
      },
    });

    res.status(201).json(successResponse(delivery));
  } catch (err) {
    next(err);
  }
};