import { Bell, CheckCheckIcon, CircleX, ClockArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';

import type { NotificationResource } from '@api/types';

export function getNotificationInfo(n: NotificationResource) {
  const data = n.data as Record<string, string> | undefined;
  return {
    title: data?.title ?? data?.subject ?? n.type ?? 'Notificación',
    description: data?.message ?? data?.description ?? '',
    icon: data?.icon ?? '',
  };
}

export function statusIcon(icon: string): ReactNode {
  switch (icon) {
    case 'success':
      return <CheckCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />;
    case 'error':
      return <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />;
    case 'warning':
      return <ClockArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />;
    case 'progress':
      return <ClockArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />;
    default:
      return <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  }
}

export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
