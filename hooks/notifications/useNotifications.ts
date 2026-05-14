import { useQuery } from '@tanstack/react-query';
import { fetchNotifications } from './fetchNotifications';

export const useNotifications = (company?: string) => {
  const query = useQuery({
    queryKey: ['notifications', company],
    queryFn: () => fetchNotifications(company),
    enabled: !!company,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
  });

  const notifications = query.data ?? [];

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const latestNotification = notifications[0] ?? null;

  return {
    ...query,
    notifications,
    unreadCount,
    latestNotification,
  };
};