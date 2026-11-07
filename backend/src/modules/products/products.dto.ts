import { z } from 'zod';

export const productCreateSchema = z.object({
  categoryId: z.string().uuid('معرف التصنيف غير صالح'),
  name: z.string().min(2, 'اسم المنتج مطلوب'),
  description: z.string().optional(),
  price: z.number().int().positive('السعر يجب أن يكون رقم صحيح موجب'),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateDto = z.infer<typeof productCreateSchema>;
export type ProductUpdateDto = z.infer<typeof productUpdateSchema>;