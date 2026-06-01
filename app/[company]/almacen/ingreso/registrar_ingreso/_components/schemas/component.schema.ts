import { z } from 'zod';
import { baseArticleFields } from './base-article.schema';

export const componentFormSchema = z
  .object({
    ...baseArticleFields,
    serial: z.string().min(2, { message: 'El serial debe contener al menos 2 caracteres.' }).optional(),
    zone: z.string({ message: 'Debe ingresar la ubicación del artículo.' }).min(1, 'Campo requerido'),
    caducate_date: z.string().optional(),
    fabrication_date: z.string().optional(),
    calendary_date: z.string().optional(),
    cost: z.string().optional(),
    hour_date: z.coerce
      .number({ required_error: 'Ingrese las horas máximas.' })
      .min(0, 'No puede ser negativo')
      .optional(),
    cycle_date: z.coerce
      .number({ required_error: 'Ingrese los ciclos máximos.' })
      .min(0, 'No puede ser negativo')
      .optional(),
  })
  .superRefine((vals, ctx) => {
    if (vals.fabrication_date && vals.caducate_date) {
      if (vals.fabrication_date > vals.caducate_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fabricación no puede ser posterior a la fecha de caducidad.',
          path: ['fabrication_date'],
        });
      }
    }
  });

export type ComponentFormValues = z.infer<typeof componentFormSchema>;
