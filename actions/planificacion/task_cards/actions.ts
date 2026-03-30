"use client"
import { taskCardsStoreMutation } from '@api/queries';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateTaskCard = () => {
  return useMutation({
    ...taskCardsStoreMutation(),
    onError: () => {
      toast.error('No se pudo crear la task card');
    },
  });
};
