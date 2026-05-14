'use client';

import { Notification } from '@/types/notifications/types';
import { cn } from '@/lib/utils';
import { Bell, Circle } from 'lucide-react';

export default function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const isUnread = !notification.read_at;

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-3 cursor-pointer transition-all',
        'hover:bg-muted/50 active:bg-muted/70'
      )}
    >
      {/* ICON */}
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isUnread
              ? 'bg-blue-500/10 text-blue-600'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Bell className="w-4 h-4" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">

        {/* TITLE + DOT */}
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {notification.data.title}
          </p>

          {isUnread && (
            <Circle className="w-2 h-2 fill-blue-500 text-blue-500 mt-1" />
          )}
        </div>

        {/* MESSAGE */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.data.message}
        </p>

        {/* FOOTER (FUTURO: timestamp / actions) */}
        <div className="mt-1 flex items-center justify-between">

          {isUnread ? (
            <span className="text-[10px] text-blue-600 font-medium">
              Nueva
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Leída
            </span>
          )}

        </div>
      </div>
    </div>
  );
}