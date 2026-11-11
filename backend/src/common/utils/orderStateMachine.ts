import { OrderStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const orderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
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

const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: 'جديد',
  ACCEPTED_BY_MERCHANT: 'تم قبول الطلب',
  PREPARING: 'قيد التحضير',
  READY_FOR_PICKUP: 'جاهز للاستلام',
  ASSIGNED_TO_DRIVER: 'تم تعيين سائق',
  ON_THE_WAY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  REJECTED_BY_MERCHANT: 'مرفوض من المتجر',
  CANCELLED_BY_CUSTOMER: 'ملغي من العميل',
  DELIVERY_FAILED: 'تعذر التوصيل',
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  return orderStatusTransitions[current].includes(next);
}

export async function transitionOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  nextStatus: OrderStatus,
  changedBy: string,
  note?: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      customerId: true,
      store: { select: { ownerUserId: true } },
      deliveries: { select: { driver: { select: { userId: true } } } },
    },
  });

  if (!order) throw new AppError('NOT_FOUND', 'الطلب غير موجود', 404);
  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    throw new AppError(
      'INVALID_TRANSITION',
      `لا يمكن تغيير الحالة من ${order.status} إلى ${nextStatus}`,
      409
    );
  }

  const updatedOrder = await tx.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: nextStatus,
      changedBy,
      note: note || `تم تغيير الحالة إلى ${orderStatusLabels[nextStatus]}`,
    },
  });

  const admins = await tx.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  const recipients = new Set<string>([order.customerId]);
  if (order.store) recipients.add(order.store.ownerUserId);
  for (const delivery of order.deliveries) {
    recipients.add(delivery.driver.userId);
  }
  for (const admin of admins) {
    recipients.add(admin.id);
  }
  recipients.delete(changedBy);

  if (recipients.size > 0) {
    await tx.notification.createMany({
      data: Array.from(recipients, (userId) => ({
        userId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'تحديث حالة الطلب',
        body: `حالة الطلب: ${orderStatusLabels[nextStatus]}`,
      })),
    });
  }

  return updatedOrder;
}
