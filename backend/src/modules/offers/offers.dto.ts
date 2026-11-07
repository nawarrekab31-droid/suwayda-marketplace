import { z } from 'zod';

export const offerCreateSchema = z.object({
  productId: z.string().uuid().optional(),
  title: z.string().min(2, 'عنوان العرض مطلوب'),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().int().positive('قيمة الخصم يجب أن تكون موجبة'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const offerUpdateSchema = offerCreateSchema.partial();

export type OfferCreateDto = z.infer<typeof offerCreateSchema>;
export type OfferUpdateDto = z.infer<typeof offerUpdateSchema>;