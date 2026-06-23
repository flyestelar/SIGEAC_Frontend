'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { MaintenanceControlResource } from '@api/types';
import { Tooltip as TooltipBase } from 'radix-ui';
import { cva } from 'class-variance-authority';
import {
  AlertTriangle,
  Calendar,
  ClipboardPenLine,
  Clock,
  LucideIcon,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { ComputedMetric } from '../_data/utils';
import { AlertLevel } from '../_data/types';
import { MetricType } from '../_data/types';

export type ComputedControl = {
  control: MaintenanceControlResource;
  metrics: ComputedMetric[];
  status: AlertLevel;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  FH: 'Horas',
  FC: 'Ciclos',
  DAYS: 'Calendario',
};

export const METRIC_UNITS: Record<MetricType, string> = {
  FH: 'FH',
  FC: 'FC',
  DAYS: 'días',
};

export const METRIC_ICONS: Record<MetricType, typeof Clock> = {
  FH: Clock,
  FC: RefreshCw,
  DAYS: Calendar,
};

export const INTERVAL_KEYS: Record<MetricType, 'interval_fh' | 'interval_fc' | 'interval_days'> = {
  FH: 'interval_fh',
  FC: 'interval_fc',
  DAYS: 'interval_days',
};

export const SINCE_LAST_KEYS: Record<MetricType, 'fh' | 'fc' | 'days'> = {
  FH: 'fh',
  FC: 'fc',
  DAYS: 'days',
};

export const ALL_METRIC_TYPES: MetricType[] = ['FH', 'FC', 'DAYS'];

const levelBadgeVariants = cva('text-white text-[10px] font-medium tracking-wide inline-flex items-center gap-1', {
  variants: {
    status: {
      OVERDUE: 'bg-red-500 hover:bg-red-600',
      WARNING: 'bg-amber-500 hover:bg-amber-600',
      OK: 'bg-emerald-500 hover:bg-emerald-600',
    } satisfies Record<AlertLevel, string>,
    size: {
      small: 'h-5 px-1.5 text-[10px]',
      medium: 'h-6 px-2 text-[11px]',
    },
  },
});

export const LEVEL_CONFIG: Record<
  AlertLevel,
  {
    icon: LucideIcon;
    cardBorder: string;
    cardBg: string;
    iconBg: string;
    iconText: string;
    progressIndicator: string;
    label: string;

    accentText: string;
    accentBorder: string;
  }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    cardBorder: 'border-l-4 border-l-red-500 border-red-500/20',
    cardBg: 'bg-red-500/5 dark:bg-red-950/20',
    iconBg: 'bg-red-500/10 border border-red-500/20',
    iconText: 'text-red-600 dark:text-red-400',
    progressIndicator: 'bg-red-500',
    label: 'Vencido',
    accentText: 'text-red-600 dark:text-red-400',
    accentBorder: 'border-red-500',
  },
  WARNING: {
    icon: AlertTriangle,
    cardBorder: 'border-l-4 border-l-amber-500 border-amber-500/20',
    cardBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    iconBg: 'bg-amber-500/10 border border-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    progressIndicator: 'bg-amber-500',
    label: 'Próximo',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'border-amber-500',
  },
  OK: {
    icon: ShieldCheck,
    cardBorder: 'border-l-4 border-l-emerald-500 border-emerald-500/20',
    cardBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    progressIndicator: 'bg-emerald-500',
    label: 'En tiempo',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'border-emerald-500',
  },
};

export function EnCursoBadge({ workOrderLabel }: { workOrderLabel?: string }) {
  const { selectedCompany } = useCompanyStore();
  const badge = (
    <Link
      href={`/${selectedCompany?.slug}/planificacion/ordenes_trabajo/${workOrderLabel}`}
      onClick={(e) => e.stopPropagation()}
      className="font-medium rounded-full inline-flex items-center gap-0.5 whitespace-nowrap h-5 bg-sky-500/20 px-1.5 text-[10px] text-sky-600 dark:text-sky-400"
    >
      <Wrench className="h-2.5 w-2.5" />
      En curso
    </Link>
  );

  if (!workOrderLabel) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={80}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipBase.Portal>
          <TooltipBase.Content side="top" className="text-muted-foreground flex gap-2 items-center">
            <ClipboardPenLine className="size-4" /> <strong>{workOrderLabel}</strong>
          </TooltipBase.Content>
        </TooltipBase.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AlertBadge({ status, size = 'small' }: { status: AlertLevel; size?: 'small' | 'medium' }) {
  const cfg = LEVEL_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge className={cn(levelBadgeVariants({ size, status }))}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}
