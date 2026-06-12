'use client';

import { useAuth } from '@/contexts/AuthContext';
import { statusIcon } from '@/lib/notification';
import { RequisitionNotificationPayload } from '@/lib/echo-events';
import { notificationIndexInfiniteQueryKey, notificationUnreadCountQueryKey, notificationUnreadQueryKey } from '@api/queries';
import { useEcho } from '@laravel/echo-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function RequisitionNotificationListener() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user?.id) {
    return <RequisitionNotificationChannel userId={user.id} />;
  }

  return null;
}

function RequisitionNotificationChannel({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateBell = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationUnreadQueryKey() });
    queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey() });
    queryClient.invalidateQueries({ queryKey: notificationIndexInfiniteQueryKey() });
  }, [queryClient]);

  const onNotification = useCallback(
    (payload: RequisitionNotificationPayload) => {
      const title = payload.title ?? 'Nueva requisición';
      const description = payload.message ?? '';
      const rawUrl = payload.url ?? null;
      const url = rawUrl ? rawUrl.replace('/compras/requisiciones/', '/solicitudes_material_faltante/') : null;

      invalidateBell();

      toast(title, {
        id: payload.id,
        description,
        icon: payload.icon ? statusIcon(payload.icon) : undefined,
        duration: 15000,
        dismissible: true,
        action: url
          ? {
              label: 'Ver',
              onClick: () => router.push(url),
            }
          : undefined,
      });
    },
    [router, invalidateBell],
  );

  useEcho<RequisitionNotificationPayload>(
    `requisition-notification.${userId}`,
    '.requisition-notification-event',
    onNotification,
    [onNotification],
    'private',
  );

  useEcho(
    `notifications.${userId}`,
    '.new-notification',
    invalidateBell,
    [invalidateBell],
    'private',
  );

  return null;
}
