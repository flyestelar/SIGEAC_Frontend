'use client';

import { PlanificationAlertResource } from '@api/types.gen';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { container: string }> = {
  OVERDUE: { container: 'bg-red-600 text-white' },
  WARNING: { container: 'bg-amber-600 text-white' },
  OK: { container: 'bg-emerald-600 text-white' },
};

const TYPE_PREFIX: Record<string, string> = {
  maintenance_control: 'Ctrl',
  hard_time: 'HT',
  directive: 'Dir',
};

export function DateGridEvent({
  calendarEvent,
}: {
  calendarEvent: {
    _alert?: PlanificationAlertResource;
    title?: string;
    calendar?: string;
    [key: string]: unknown;
  };
}) {
  const alert = calendarEvent._alert;
  const status = calendarEvent.calendar ?? '';
  const itemType = alert?.item_type ?? '';
  const styles = STATUS_STYLES[status] ?? { container: 'bg-muted/30 text-foreground' };

  return (
    <div
      className={cn(
        'flex h-full w-full items-center gap-1 overflow-hidden rounded-[3px] px-1.5 py-0.5 text-[11px] leading-tight',
        styles.container,
      )}
    >
      {itemType && (
        <span className="shrink-0 rounded-[2px] bg-black/15 px-0.5 font-semibold uppercase tracking-wider text-[9px] text-white/90">
          {TYPE_PREFIX[itemType] || itemType}
        </span>
      )}
      <span className="truncate font-medium">{calendarEvent.title}</span>
    </div>
  );
}
