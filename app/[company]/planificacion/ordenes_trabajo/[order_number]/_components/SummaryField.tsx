import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SummaryField({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-h-14 bg-background px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={cn('mt-1 text-[13px] font-medium leading-tight text-foreground/90', mono && 'font-mono')}>
        {value}
      </div>
    </div>
  );
}
