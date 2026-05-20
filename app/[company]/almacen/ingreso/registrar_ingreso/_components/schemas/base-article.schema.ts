import { z } from 'zod';
import { FILE_MAX_BYTES } from '../../_lib/utils';

/** Reusable file field with 10 MB limit */
export const fileField = () =>
  z
    .instanceof(File, { message: 'Suba un archivo válido.' })
    .refine((f) => f.size <= FILE_MAX_BYTES, 'Tamaño máximo 10 MB.')
    .optional();

/** Preprocess for alternative_part_number — accepts string, array, or empty */
export const alternativePartNumberField = () =>
  z
    .preprocess(
      (val) => {
        if (val === '' || val == null) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val
            .split(/[\n,;]+/g)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      },
      z.array(
        z.string().min(2, {
          message: 'Cada número de parte alterno debe contener al menos 2 caracteres.',
        }),
      ),
    )
    .optional();

/** Fields shared across all 3 article forms */
export const baseArticleFields = {
  part_number: z
    .string({ message: 'Debe ingresar un número de parte.' })
    .min(2, { message: 'El número de parte debe contener al menos 2 caracteres.' }),
  alternative_part_number: alternativePartNumberField(),
  inspector: z.string().optional(),
  reception_date: z.string().optional(),
  description: z.string().optional(),
  zone: z.string().optional(),
  manufacturer_id: z.string().optional(),
  condition_id: z.string().min(1, 'Debe ingresar la condición del artículo.'),
  batch_id: z.string({ message: 'Debe ingresar un lote.' }).min(1, 'Seleccione un lote'),
  certificate_8130: fileField(),
  certificate_fabricant: fileField(),
  certificate_vendor: fileField(),
  image: z.instanceof(File).optional(),
};
