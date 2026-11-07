import { z } from 'zod';

export const storeCreateSchema = z.object({
  name: z.string().min(2, 'اسم المتجر مطلوب'),
  description: z.string().optional(),
  address: z.string().min(5, 'عنوان المتجر مطلوب'),
  phone: z.string().min(10, 'هاتف المتجر مطلوب'),
  workingHours: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    days: z.array(z.string()),
  }).optional(),
});

export const storeUpdateSchema = storeCreateSchema.partial();

export const storeApproveSchema = z.object({
  action: z.enum(['approve', 'suspend', 'reject']),
});

export type StoreCreateDto = z.infer<typeof storeCreateSchema>;
export type StoreUpdateDto = z.infer<typeof storeUpdateSchema>;
export type StoreApproveDto = z.infer<typeof storeApproveSchema>;