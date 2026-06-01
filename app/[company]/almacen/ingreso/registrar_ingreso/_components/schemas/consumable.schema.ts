import { z } from 'zod';
import { baseArticleFields } from './base-article.schema';

export const consumableFormSchema = z.object({
  ...baseArticleFields,
  lot_number: z.string().optional(),
  caducate_date: z.string().optional(),
  fabrication_date: z.string().optional(),
  quantity: z.coerce.number({ message: 'Debe ingresar una cantidad.' }).min(0, { message: 'No puede ser negativo.' }),
  is_managed: z.boolean().optional(),
  convertion_id: z.number().optional(),
});

export type ConsumableFormValues = z.infer<typeof consumableFormSchema>;
