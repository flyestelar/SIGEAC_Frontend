'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMarkAsRead } from '@/hooks/sistema/useNotifications';
import { statusIcon } from '@/lib/notification';
import { notificationUnreadCountQueryKey, notificationUnreadQueryKey } from '@api/queries';
import { useEchoNotification } from '@laravel/echo-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationPayload {
  id: string;
  type: string;
  title?: string;
  message?: string;
  description?: string;
  icon?: string;
  url?: string;
  [key: string]: unknown;
}
/**
 * Mount this once near the root of the app (inside AuthProvider).
 *
 * Listens for real-time Laravel broadcast notifications on the
 * authenticated user's private channel (`App.Models.User.{userId}`)
 * and shows them as Sonner toasts.
 */
export function NotificationListener() {
  const { user, isAuthenticated } = useAuth();

  // Only subscribe when we have an authenticated user
  if (isAuthenticated && user?.id) {
    return <NotificationChannel userId={user.id} />;
  }

  return null;
}

function NotificationChannel({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markAsRead = useMarkAsRead();

  const showNotification = useCallback(
    (payload: NotificationPayload) => {
      const title = payload.title ?? 'Notificación';
      const description = payload.message ?? payload.description ?? '';
      const url = typeof payload.url === 'string' ? payload.url : '/sistema/notificaciones';

      toast(title, {
        id: payload.id,
        description,
        icon: payload.icon ? statusIcon(payload.icon) : undefined,
        duration: 15000,
        dismissible: true,
        action: url
          ? {
              label: 'Ver',
              onClick: () => {
                router.push(url);
                markAsRead.mutate({ path: { id: payload.id } });
              },
            }
          : undefined,
        onDismiss() {
          markAsRead.mutate({ path: { id: payload.id } });
        },
      });
    },
    [markAsRead, router],
  );

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     showNotification({
  //       id: 'test',
  //       type: 'App\\Notifications\\TestNotification',
  //       title: 'Notificación de prueba',
  //       description: 'Esta es una notificación de prueba para verificar la conexión en tiempo real.',
  //       icon: ['info', 'success', 'warning', 'error'][Math.floor(Math.random() * 4)],
  //       url: '/sistema/notificaciones',
  //     });
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [showNotification]);

  const onNotification = useCallback(
    (payload: NotificationPayload) => {
      queryClient.invalidateQueries({ queryKey: notificationUnreadQueryKey() });
      queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey() });

      showNotification(payload);
    },
    [queryClient, showNotification],
  );
  useEchoNotification(`App.Models.User.${userId}`, onNotification);
  return null;
}
