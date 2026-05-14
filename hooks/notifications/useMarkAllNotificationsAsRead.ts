import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const useMarkAllNotificationsAsRead = (company?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axiosInstance.post(
        `/${company}/notifications/mark-all-read`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', company],
      });
    },
  });
};