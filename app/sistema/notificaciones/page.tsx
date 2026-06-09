'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Loader2, MailOpen } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useGetNotificationsInfinite,
  useGetUnreadNotificationsCount,
  useMarkAllAsRead,
  useMarkAsRead,
} from '@/hooks/sistema/useNotifications';
import { Button } from '@/components/ui/button';
import { formatTime, getNotificationInfo, statusIcon } from '@/lib/notification';
import { useRouter } from 'next/navigation';

type FilterTab = 'all' | 'unread' | 'read';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'No leídas' },
  { key: 'read', label: 'Leídas' },
];

export default function NotificacionesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotificationsInfinite({ per_page: 20, mode: activeFilter });
  const { data: countData } = useGetUnreadNotificationsCount();
  const markAllAsRead = useMarkAllAsRead();

  const allNotifications = infiniteData?.pages.flatMap((page) => page.data) || [];
  const unreadCount = countData?.count ?? 0;
  const router = useRouter();
  const markAsRead = useMarkAsRead();

  return (
    <ContentLayout>
      <div className="mx-auto max-w-3xl">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? (
                'Cargando...'
              ) : (
                <>
                  Tienes <span className="font-medium text-foreground">{unreadCount} notificaciones</span> sin leer
                </>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate({})}
              disabled={markAllAsRead.isPending}
              className="text-xs"
            >
              {markAllAsRead.isPending ? 'Marcando...' : 'Marcar todo como leído'}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors',
                activeFilter === tab.key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : allNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MailOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No hay notificaciones</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {activeFilter === 'unread'
                ? 'Todas las notificaciones han sido leídas'
                : 'No hay notificaciones que mostrar'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {allNotifications.map((n) => {
                const info = getNotificationInfo(n);
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const url = n.url || '/sistema/notificaciones';
                      router.push(url);
                      if (!n.read_at) markAsRead.mutate({ path: { id: n.id } });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const url = n.url || '/sistema/notificaciones';
                        router.push(url);
                        if (!n.read_at) markAsRead.mutate({ path: { id: n.id } });
                      }
                    }}
                    className={cn(
                      'cursor-pointer rounded-lg border border-border/60 border-l-4 transition-colors hover:bg-muted/30',
                      !n.read_at ? 'border-l-sky-500 bg-sky-500/[0.02]' : 'border-l-muted',
                    )}
                  >
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <div className="mt-0.5 shrink-0">{statusIcon(info.icon)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">{info.title}</p>
                              {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                            </div>
                            {info.description && (
                              <p className="mt-0.5 text-sm text-muted-foreground/80">{info.description}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="whitespace-nowrap text-xs text-muted-foreground/60">
                              {formatTime(n.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ver más'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
