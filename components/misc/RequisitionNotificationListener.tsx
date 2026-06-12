'use client';

import { useAuth } from '@/contexts/AuthContext';
import { statusIcon } from '@/lib/notification';
import { RequisitionNotificationPayload } from '@/lib/echo-events';
import { useEcho } from '@laravel/echo-react';
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

  const onNotification = useCallback(
    (payload: RequisitionNotificationPayload) => {
      const title = payload.title ?? 'Nueva requisición';
      const description = payload.message ?? '';
      const url = payload.url ?? null;

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
    [router],
  );

  useEcho<RequisitionNotificationPayload>(
    `requisition-notification.${userId}`,
    '.requisition-notification-event',
    onNotification,
    [onNotification],
    'private',
  );

  return null;
}
