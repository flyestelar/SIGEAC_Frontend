import { z } from 'zod';
import { baseArticleFields } from './base-article.schema';

export const toolFormSchema = z
  .object({
    ...baseArticleFields,
    article_type: z.string().optional(),
    inspector: z.string({ message: 'Debe ingresar un inspector.' }),
    reception_date: z.string({ message: 'Debe ingresar una fecha de recepción.' }),
    serial: z.string().optional(),
    model: z.string().optional(),
    description: z.string().min(2, 'Al menos 2 caracteres.'),
    zone: z.string().min(1, 'Campo requerido'),
    manufacturer_id: z.string().min(1, 'Seleccione un fabricante'),
    needs_calibration: z.boolean().optional(),
    calibration_date: z.date().optional(),
    next_calibration: z.union([z.coerce.number().int().positive(), z.nan()]).optional(),
  })
  .superRefine((vals, ctx) => {
    if (vals.needs_calibration) {
      if (!vals.calibration_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese la última fecha de calibración.',
          path: ['calibration_date'],
        });
      }
      if (
        vals.next_calibration === undefined ||
        vals.next_calibration === null ||
        Number.isNaN(vals.next_calibration) ||
        (typeof vals.next_calibration === 'number' && vals.next_calibration <= 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese días para la próxima calibración (número > 0).',
          path: ['next_calibration'],
        });
      }
    }
  });

export type ToolFormValues = z.infer<typeof toolFormSchema>;
