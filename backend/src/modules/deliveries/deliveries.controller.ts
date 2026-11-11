import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';
import { DeliveryStatus, OrderStatus, Prisma } from '@prisma/client';
import { transitionOrderStatus } from '../../common/utils/orderStateMachine';
import { assignDriverSchema, deliveryStatusUpdateSchema } from './deliveries.dto';

const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
};

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

    const { status, failReason } = deliveryStatusUpdateSchema.parse(req.body);
    const deliveryId = req.params.id;

    const driver = await prisma.driver.findUnique({ where: { userId: user.userId } });
    if (!driver) throw new AppError('NOT_FOUND', 'ملف السائق غير موجود', 404);

    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new AppError('NOT_FOUND', 'التوصيل غير موجود', 404);
    if (delivery.driverId !== driver.id) throw new AppError('FORBIDDEN', 'ليس لك صلاحية', 403);

    const allowedNext = VALID_DELIVERY_TRANSITIONS[delivery.status] || [];
    if (!allowedNext.includes(status)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `لا يمكن تغيير الحالة من ${delivery.status} إلى ${status}`,
        409
      );
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const data: Prisma.DeliveryUpdateInput = { status };

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

      let newOrderStatus: OrderStatus | null = null;
      if (status === 'PICKED_UP') newOrderStatus = 'ON_THE_WAY';
      else if (status === 'DELIVERED') newOrderStatus = 'DELIVERED';
      else if (status === 'FAILED') newOrderStatus = 'DELIVERY_FAILED';

      if (newOrderStatus) {
        await transitionOrderStatus(
          tx,
          delivery.orderId,
          newOrderStatus,
          user.userId,
          status === 'PICKED_UP' ? 'في طريق التوصيل'
            : status === 'DELIVERED' ? 'تم التوصيل'
            : 'فشل التوصيل'
        );
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
            store: { select: { name: true, address: true, phone: true, ownerUserId: true } },
            items: true,
          },
        },
        driver: { select: { id: true, userId: true, vehicle: true, isOnline: true, createdAt: true } },
      },
    });
    if (!delivery) throw new AppError('NOT_FOUND', 'التوصيل غير موجود', 404);
    const user = (req as any).user;
    const canAccess =
      user.role === 'ADMIN' ||
      (user.role === 'DRIVER' && delivery.driver.userId === user.userId) ||
      (user.role === 'CUSTOMER' && delivery.order.customerId === user.userId) ||
      (user.role === 'MERCHANT' && delivery.order.store?.ownerUserId === user.userId);
    if (!canAccess) throw new AppError('FORBIDDEN', 'غير مصرح بالوصول لهذا التوصيل', 403);
    const responseData = {
      ...delivery,
      order: {
        ...delivery.order,
        store: delivery.order.store
          ? {
            name: delivery.order.store.name,
            address: delivery.order.store.address,
            phone: delivery.order.store.phone,
          }
          : null,
      },
    };
    res.json(successResponse(responseData));
  } catch (err) {
    next(err);
  }
};

export const assignDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new AppError('FORBIDDEN', 'للوحة إدارة فقط', 403);

    const { driverId, orderId } = assignDriverSchema.parse(req.body);

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new AppError('NOT_FOUND', 'الساق غير موجود', 404);

    const delivery = await prisma.$transaction(async (tx) => {
      const existing = await tx.delivery.findFirst({ where: { orderId } });
      if (existing && existing.status !== 'FAILED') {
        throw new AppError('CONFLICT', 'هذا الطلب تمت توزيعه بالفعل', 409);
      }

      const newDelivery = existing
        ? await tx.delivery.update({
          where: { id: existing.id },
          data: {
            driverId,
            status: 'ASSIGNED',
            assignedAt: new Date(),
            pickedAt: null,
            deliveredAt: null,
            failedAt: null,
            failReason: null,
          },
        })
        : await tx.delivery.create({
          data: { orderId, driverId, status: 'ASSIGNED' },
        });

      await transitionOrderStatus(
        tx,
        orderId,
        'ASSIGNED_TO_DRIVER',
        user.userId,
        'تم تعيين سائق'
      );

      return newDelivery;
    });

    res.status(201).json(successResponse(delivery));
  } catch (err) {
    next(err);
  }
};