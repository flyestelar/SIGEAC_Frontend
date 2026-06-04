import {
  notificationIndexInfiniteOptions,
  notificationIndexQueryKey,
  notificationMarkAllAsReadMutation,
  notificationMarkAsReadMutation,
  notificationUnreadCountOptions,
  notificationUnreadCountQueryKey,
  notificationUnreadOptions,
  notificationUnreadQueryKey,
} from '@api/queries';
import { NotificationIndexData } from '@api/types';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useGetUnreadNotificationsCount() {
  return useQuery({
    ...notificationUnreadCountOptions(),
    refetchInterval: 60_000, // 60 seconds
  });
}

export function useGetUnreadNotifications(perPage = 10) {
  return useQuery({
    ...notificationUnreadOptions({ query: { per_page: perPage } }),
    refetchInterval: 60000, // 60 seconds
  });
}

export function useGetNotificationsInfinite(query: NotificationIndexData['query'] = {}) {
  return useInfiniteQuery({
    ...notificationIndexInfiniteOptions({ query }),
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    refetchInterval: 60000,
  });
}

export function useMarkAsRead() {
  return useMutation({
    ...notificationMarkAsReadMutation(),
    onSuccess: (data, variables, result, context) => {
      context.client.invalidateQueries({ queryKey: notificationUnreadQueryKey() });
      context.client.invalidateQueries({ queryKey: notificationUnreadCountQueryKey() });
      context.client.invalidateQueries({ queryKey: notificationIndexQueryKey() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al marcar notificación');
    },
  });
}

export function useMarkAllAsRead() {
  return useMutation({
    ...notificationMarkAllAsReadMutation(),
    onSuccess: (data, variables, result, context) => {
      context.client.invalidateQueries({ queryKey: notificationUnreadQueryKey() });
      context.client.invalidateQueries({ queryKey: notificationUnreadCountQueryKey() });
      context.client.invalidateQueries({ queryKey: notificationIndexQueryKey() });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al marcar notificaciones');
    },
  });
}
