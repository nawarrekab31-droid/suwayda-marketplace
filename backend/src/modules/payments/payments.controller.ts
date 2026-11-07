import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { orderId, method, amount, reference, receiptUrl } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);

    const canPay =
      user.role === 'CUSTOMER' && order.customerId === user.userId ||
      user.role === 'ADMIN';

    if (!canPay) throw new AppError('FORBIDDEN', 'غير مصرح', 403);

    const payment = await prisma.payment.create({
      data: {
        orderId,
        method,
        amount,
        reference,
        receiptUrl,
        status: method === 'CASH_ON_DELIVERY' ? 'PENDING' : 'CONFIRMED',
      },
    });

    if (method === 'CASH_ON_DELIVERY') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      });
    }

    res.status(201).json(successResponse(payment));
  } catch (err) {
    next(err);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const where: any = {};

    if (user.role === 'CUSTOMER') {
      const customerOrders = await prisma.order.findMany({
        where: { customerId: user.userId },
        select: { id: true },
      });
      where.orderId = { in: customerOrders.map((o) => o.id) };
    } else if (user.role === 'MERCHANT') {
      const storeOrders = await prisma.order.findMany({
        where: { storeId: user.userId },
        select: { id: true },
      });
      where.orderId = { in: storeOrders.map((o) => o.id) };
    }

    const { page = 1, limit = 20, status } = req.query;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { order: { select: { id: true, customerId: true, storeId: true, total: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json(successResponse(payments, { page: Number(page), limit: Number(limit), total }));
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new AppError('FORBIDDEN', 'للإدارة فقط', 403);

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });

    res.json(successResponse(payment));
  } catch (err) {
    next(err);
  }
};