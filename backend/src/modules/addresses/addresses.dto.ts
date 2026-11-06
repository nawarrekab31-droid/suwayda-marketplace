import { z } from 'zod';

export const addressCreateSchema = z.object({
  label: z.string().min(1, 'اسم العنوان مطلوب'),
  area: z.string().min(1, 'الحي مطلوب'),
  street: z.string().min(1, 'الشارع مطلوب'),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const addressUpdateSchema = z.object({
  label: z.string().optional(),
  area: z.string().optional(),
  street: z.string().optional(),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});