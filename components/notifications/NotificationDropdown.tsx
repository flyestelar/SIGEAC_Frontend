'use client';

import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useCompanyStore } from '@/stores/CompanyStore';
import NotificationItem from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Inbox, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { selectedCompany } = useCompanyStore();
  const { notifications, unreadCount } = useNotifications(
    selectedCompany?.slug
  );

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* container */}
      <div className="absolute right-0 mt-2 w-96 z-50 rounded-xl border bg-background shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 backdrop-blur">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Notificaciones
            </h3>

            <p className="text-xs text-muted-foreground">
              {unreadCount} sin leer
            </p>
          </div>
        </div>

        <Separator />

        {/* CONTENT */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin">

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Sin notificaciones
              </p>
              <p className="text-xs text-muted-foreground">
                Todo está al día
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}