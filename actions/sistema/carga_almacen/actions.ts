import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; // o "@/components/ui/use-toast"
import axiosInstance from '@/lib/axios';

type ImportPayload = {
  file: File;
  company: string;
  extra?: Record<string, string | number | boolean>; // opcional
  path?: string; // opcional: por defecto usa `/${company}/inventory/import`
};

export const useImportInventory = () => {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);

  const importMutation = useMutation({
    mutationFn: async ({ file, company, extra, path }: ImportPayload) => {
      const form = new FormData();
      form.append('file', file);
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => form.append(k, String(v)));
      }

      const url = path ?? `/${company}/batch-import`;

      await axiosInstance.post(url, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: any) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast('Importación completada', {
        description: 'El archivo se procesó correctamente.',
      });
      setProgress(0);
    },
    onError: (error: any) => {
      toast('Error al importar', {
        description: error?.response?.data?.message || error?.message || 'No se pudo procesar el archivo.',
      });
      setProgress(0);
    },
  });

  return {
    importInventory: importMutation,
    progress, // 0–100
    setProgress, // por si quieres resetear manualmente
  };
};
