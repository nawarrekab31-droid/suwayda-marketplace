import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
}).strict();
