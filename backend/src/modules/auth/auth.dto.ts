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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type MerchantRegisterDto = z.infer<typeof merchantRegisterSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;