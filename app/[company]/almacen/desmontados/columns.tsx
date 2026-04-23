'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';

import DismountedArticleDropdownActions from '@/components/dropdowns/mantenimiento/almacen/DismountedArticleDropdownActions';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { cn } from '@/lib/utils';
import type { ArticleListItemResource, Batch } from '@api/types';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

function fmtNumber(value: number | string | null | undefined, digits = 1) {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function conditionPalette(name?: string | null) {
  const key = (name ?? '').toUpperCase();
  if (/SERVICEABLE|NEW|NS/.test(key))
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (/REPAIR|OVERHAUL|OH/.test(key)) return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (/UNSERV|BER|SCRAP|REJECT/.test(key))
    return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400';
}

export const columns: ColumnDef<ArticleListItemResource>[] = [
  {
    accessorKey: 'part_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="PN / SN" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-mono text-sm font-medium">{row.original.part_number ?? '—'}</span>
        <span className="font-mono text-xs text-muted-foreground">SN {row.original.serial ?? '—'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => {
      const batch = row.original.batch as unknown as Batch | string | null | undefined;
      const batchLabel = typeof batch === 'string' ? batch : batch?.name ?? null;
      return (
        <div className="flex max-w-[260px] flex-col">
          <span className="truncate text-sm font-medium">{batchLabel ?? '—'}</span>
          {row.original.description && (
            <span className="truncate text-xs text-muted-foreground">{row.original.description}</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'condition',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Condición" />,
    cell: ({ row }) => {
      const cond = row.original.condition as unknown as { name?: string } | null;
      const name = cond?.name ?? '—';
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
            conditionPalette(name),
          )}
        >
          {name}
        </span>
      );
    },
  },
  {
    id: 'aircraft',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aeronave" />,
    cell: ({ row }) => {
      const slot = row.original.aircraft_part?.last_installation as unknown as
        | { aircraft_slot?: { aircraft?: { acronym?: string; model?: string } } }
        | undefined;
      const aircraft = slot?.aircraft_slot?.aircraft;
      if (!aircraft) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium">{aircraft.acronym ?? '—'}</span>
          <span className="text-xs text-muted-foreground">{aircraft.model ?? ''}</span>
        </div>
      );
    },
  },
  {
    id: 'slot',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slot / Parte" />,
    cell: ({ row }) => {
      const part = row.original.aircraft_part;
      if (!part) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{part.part_name}</span>
          {part.parent_part?.part_name && (
            <span className="text-xs text-muted-foreground">↳ {part.parent_part.part_name}</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'installation',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Instalación" />,
    cell: ({ row }) => {
      const inst = row.original.aircraft_part?.last_installation;
      if (!inst) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-1.5 text-xs text-foreground/80">
          <span>{fmtDate(inst.installed_at)}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span>{fmtDate(inst.removed_at)}</span>
        </div>
      );
    },
  },
  {
    id: 'usage',
    header: ({ column }) => <DataTableColumnHeader column={column} title="FH / FC en uso" />,
    cell: ({ row }) => {
      const inst = row.original.aircraft_part?.last_installation;
      if (!inst) return <span className="text-xs text-muted-foreground">—</span>;

      const installH = Number(inst.aircraft_hours_at_install ?? NaN);
      const removalH = Number(inst.aircraft_hours_at_removal ?? NaN);
      const installC = Number(inst.aircraft_cycles_at_install ?? NaN);
      const removalC = Number(inst.aircraft_cycles_at_removal ?? NaN);

      const dHours = Number.isFinite(installH) && Number.isFinite(removalH) ? removalH - installH : null;
      const dCycles = Number.isFinite(installC) && Number.isFinite(removalC) ? removalC - installC : null;

      const hLabel = fmtNumber(dHours, 1) ?? fmtNumber(inst.component_hours_at_install, 1) ?? '—';
      const cLabel = fmtNumber(dCycles, 0) ?? fmtNumber(inst.component_cycles_at_install, 0) ?? '—';

      return (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-medium">{hLabel} h</span>
          <span className="text-muted-foreground">{cLabel} ciclos</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DismountedArticleDropdownActions id={row.original.id} />
      </div>
    ),
  },
];
