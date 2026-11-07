import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ACCEPTED_BY_MERCHANT', 'REJECTED_BY_MERCHANT', 'CANCELLED_BY_CUSTOMER'],
  ACCEPTED_BY_MERCHANT: ['PREPARING', 'REJECTED_BY_MERCHANT', 'CANCELLED_BY_CUSTOMER'],
  PREPARING: ['READY_FOR_PICKUP', 'REJECTED_BY_MERCHANT'],
  READY_FOR_PICKUP: ['ASSIGNED_TO_DRIVER', 'REJECTED_BY_MERCHANT'],
  ASSIGNED_TO_DRIVER: ['ON_THE_WAY', 'DELIVERY_FAILED'],
  ON_THE_WAY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: [],
  REJECTED_BY_MERCHANT: [],
  CANCELLED_BY_CUSTOMER: [],
  DELIVERY_FAILED: ['ASSIGNED_TO_DRIVER'],
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, storeId } = req.query;
    const user = (req as any).user;
    const where: any = {};

    if (user.role === 'CUSTOMER') {
      where.customerId = user.userId;
    } else if (user.role === 'MERCHANT') {
      where.storeId = storeId || user.userId;
    } else if (storeId) {
      where.storeId = storeId;
    }

    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          store: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json(successResponse(orders, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        store: true,
        customer: { select: { name: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        deliveries: { include: { driver: true } },
        payments: true,
      },
    });
    if (!order) throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);
    res.json(successResponse(order));
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'CUSTOMER') throw new AppError('FORBIDDEN', 'للعملاء فقط', 403);

    const { addressId, paymentMethod, notes } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('EMPTY_CART', 'السلة فارغة', 400);
    }

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== user.userId) {
      throw new AppError('INVALID_ADDRESS', 'عنوان غير صالح', 400);
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new AppError('INSUFFICIENT_STOCK', `مخزون غير كافٍ للمنتج: ${item.product.name}`, 400);
      }
    }

    const orders = await prisma.$transaction(async (tx) => {
      const itemsByStore = new Map<string, typeof cart.items>();
      for (const item of cart.items) {
        if (!itemsByStore.has(item.product.storeId)) {
          itemsByStore.set(item.product.storeId, []);
        }
        itemsByStore.get(item.product.storeId)!.push(item);
      }

      const parentOrder = await tx.order.create({
        data: {
          customerId: user.userId,
          addressId,
          addressSnapshot: { area: address.area, street: address.street, notes: address.notes },
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
          status: 'NEW',
          notes,
        },
      });

      let totalAmount = 0;
      const subOrders: any[] = [];

      for (const [storeId, items] of itemsByStore.entries()) {
        let subtotal = 0;
        for (const item of items) {
          subtotal += item.product.price * item.quantity;
        }
        const deliveryFee = 2000;
        const total = subtotal + deliveryFee;
        totalAmount += total;

        const subOrder = await tx.order.create({
          data: {
            parentOrderId: parentOrder.id,
            customerId: user.userId,
            storeId,
            addressId,
            addressSnapshot: { area: address.area, street: address.street, notes: address.notes },
            subtotal,
            deliveryFee,
            total,
            paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
            status: 'NEW',
            notes,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                nameSnapshot: item.product.name,
                unitPriceSnapshot: item.product.price,
                quantity: item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        subOrders.push(subOrder);
      }

      await tx.order.update({
        where: { id: parentOrder.id },
        data: { total: totalAmount, subtotal: totalAmount },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { parentOrder, subOrders };
    });

    for (const subOrder of orders.subOrders) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: subOrder.id,
          status: 'NEW',
          changedBy: user.userId,
          note: 'تم إنشاء الطلب',
        },
      });
    }

    res.status(201).json(successResponse(orders));
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { status, note } = req.body;
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(status)) {
      throw new AppError('INVALID_TRANSITION', `لا يمكن تغيير الحالة من ${order.status} إلى ${status}`, 400);
    }

    const canTransition =
      user.role === 'ADMIN' ||
      (user.role === 'MERCHANT' && order.storeId === user.userId) ||
      (user.role === 'DRIVER' && order.deliveries?.some((d: any) => d.driverId === user.userId)) ||
      (user.role === 'CUSTOMER' && order.customerId === user.userId && ['CANCELLED_BY_CUSTOMER'].includes(status));

    if (!canTransition) {
      throw new AppError('FORBIDDEN', 'غير مصرح بتغيير حالة هذا الطلب', 403);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: status as any,
          changedBy: user.userId,
          note: note || `تم تغيير الحالة إلى ${status}`,
        },
      });

      return updated;
    });

    res.json(successResponse(updatedOrder));
  } catch (err) {
    next(err);
  }
};