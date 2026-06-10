import { cn } from '@/lib/utils';
import React from 'react';

export const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatNumber = (value?: number | string | null, decimals = 0) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-widest text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('overflow-hidden rounded-lg border bg-background', className)}>{children}</section>;
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted/30">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <FieldLabel>{title}</FieldLabel>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
