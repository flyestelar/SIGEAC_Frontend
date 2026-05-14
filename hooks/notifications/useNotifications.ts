import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchNotifications } from './fetchNotifications';

export const useNotifications = (company?: string) => {
  const queryClient = useQueryClient();
  const normalizedCompany = company ?? null;

  const query = useQuery({
    queryKey: ['notifications', normalizedCompany],

    queryFn: () => fetchNotifications(normalizedCompany as string),

    enabled: !!normalizedCompany,

    // IMPORTANTE: evita refetch innecesario al montar/desmontar
    staleTime: 1000 * 60, // 1 minuto “considerado fresco”

    // No polling fijo (esto era lo que te estaba generando tráfico innecesario)
    refetchInterval: false,

    // Refetch solo cuando el usuario vuelve a la pestaña
    refetchOnWindowFocus: true,

    // Evita refetch al reconectar si no quieres tráfico extra
    refetchOnReconnect: true,
  });

  // Derivados
  const notifications = query.data ?? [];

  const unreadCount = notifications.reduce(
    (acc, n) => acc + (n.read_at ? 0 : 1),
    0
  );

  const latestNotification = notifications.length > 0 ? notifications[0] : null;

  // 🔥 Estrategia clave SIN websocket:
  // refetch manual solo cuando el usuario abre el dropdown
  const refetchOnOpen = () => {
    if (normalizedCompany) {
      query.refetch();
    }
  };

  return {
    ...query,
    notifications,
    unreadCount,
    latestNotification,
    refetchOnOpen,
  };
};