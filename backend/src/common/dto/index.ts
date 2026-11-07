import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف مطلوب'),
  password: z.string().min(6, 'كلمة المرور مطلوبة'),
});

export const merchantRegisterSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().min(10, 'رقم الهاتف مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  storeName: z.string().min(2, 'اسم المتجر مطلوب'),
  storeDescription: z.string().optional(),
  storeAddress: z.string().min(5, 'عنوان المتجر مطلوب'),
  storePhone: z.string().min(10, 'هاتف المتجر مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'التحديث مطلوب'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type MerchantRegisterDto = z.infer<typeof merchantRegisterSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;