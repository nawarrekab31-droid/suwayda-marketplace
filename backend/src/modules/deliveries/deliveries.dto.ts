import { DeliveryStatus } from '@prisma/client';
import { z } from 'zod';

export const deliveryStatusUpdateSchema = z.object({
  status: z.nativeEnum(DeliveryStatus),
  failReason: z.string().max(500).optional(),
}).strict();

export const assignDriverSchema = z.object({
  driverId: z.string().uuid(),
  orderId: z.string().uuid(),
}).strict();
