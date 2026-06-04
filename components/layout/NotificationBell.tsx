'use client';

import { Bell, Loader2, MailOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetUnreadNotifications, useGetUnreadNotificationsCount, useMarkAsRead } from '@/hooks/sistema/useNotifications';
import { formatTime, getNotificationInfo, statusIcon } from '@/lib/notification';
import Link from 'next/link';

interface NotificationBellProps {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: countData } = useGetUnreadNotificationsCount();
  const unreadCount = countData?.count ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="relative h-8 w-8 rounded-full border-border/50 bg-background/40 backdrop-blur-sm transition-transform duration-150 ease-out hover:bg-foreground/[0.04] active:scale-[0.97]"
                variant="outline"
                size="icon"
                onClick={onClick}
              >
                <Bell className="h-[1.1rem] w-[1.1rem]" />
                <AnimatePresence>
                  {hasUnread && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-1 ring-background"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="sr-only">Notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notificaciones</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-80" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between font-normal">
          <span className="text-sm font-semibold">Notificaciones</span>
          {hasUnread && <span className="text-[11px] font-medium text-muted-foreground">{unreadCount} sin leer</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <NotificationList />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="cursor-pointer justify-center text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Link href={'/sistema/notificaciones'}>Ver todas las notificaciones</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationList() {
  const router = useRouter();
  const { data: unreadData, isLoading: notifLoading } = useGetUnreadNotifications(5);
  const markAsRead = useMarkAsRead();
  const notifications = unreadData?.data ?? [];
  return (
    <div className="max-h-[320px] overflow-y-auto">
      {notifLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <MailOpen className="mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">No hay notificaciones</p>
        </div>
      ) : (
        notifications.map((n) => {
          const info = getNotificationInfo(n);
          return (
            <DropdownMenuItem
              key={n.id}
              className="cursor-pointer py-3"
              onClick={() => {
                if (!n.read_at) {
                  markAsRead.mutate({ path: { id: n.id } });
                }
                if (
                  typeof n.data === 'object' &&
                  n.data !== null &&
                  'url' in n.data &&
                  typeof n.data.url === 'string'
                ) {
                  router.push(n.data.url);
                  return;
                }
                router.push('/sistema/notificaciones');
              }}
            >
              <div className="flex w-full gap-3">
                <div className="mt-1">{statusIcon(info.icon)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{info.title}</p>
                    {!n.read_at && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />}
                  </div>
                  {info.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{info.description}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{formatTime(n.created_at)}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })
      )}
    </div>
  );
}
