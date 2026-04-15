'use client';

import { ColumnDef } from '@tanstack/react-table';
import { WorkOrderResource } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ClipboardList, MoreHorizontal, Plane, Settings2, Layers } from 'lucide-react';
import Link from 'next/link';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  APROBADO: {
    label: 'Aprobado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  ABIERTO: {
    label: 'Abierto',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  CERRADO: {
    label: 'Cerrado',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  PENDIENTE: {
    label: 'Pendiente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  RECHAZADO: {
    label: 'Rechazado',
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

const fallbackStatus = {
  label: 'Sin estado',
  className: 'border-border bg-muted/20 text-muted-foreground',
};

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return format(parseLocalDate(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return '—';
  }
}

export const columns: ColumnDef<WorkOrderResource>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'order_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nro. Orden" />,
    cell: ({ row }) => {
      const wo = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-muted/30">
            <ClipboardList className="size-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/estelar/planificacion/ordenes_trabajo/${wo.order_number}`}
              className="whitespace-nowrap font-mono text-sm font-semibold tracking-wide text-foreground hover:text-sky-600 transition-colors"
            >
              {wo.order_number}
            </Link>
            {wo.tally_number && (
              <p className="truncate font-mono text-[11px] text-muted-foreground">{wo.tally_number}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'aircraft.acronym',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Aeronave" />,
    cell: ({ row }) => {
      const aircraft = row.original.aircraft;
      if (!aircraft) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10">
            <Plane className="size-3 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <span className="font-mono text-sm font-medium tracking-wide">{aircraft.acronym}</span>
            {aircraft.aircraft_type?.full_name && (
              <p className="truncate text-[11px] text-muted-foreground">{aircraft.aircraft_type.full_name}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Estado" />,
    cell: ({ row }) => {
      const raw = row.original.status?.toUpperCase() ?? '';
      const cfg = STATUS_CONFIG[raw] ?? fallbackStatus;
      return (
        <Badge variant="outline" className={cn('text-[11px]', cfg.className)}>
          {cfg.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'entry_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entrada" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-3 shrink-0" />
        <span>{formatDate(row.original.entry_date)}</span>
      </div>
    ),
  },
  {
    accessorKey: 'exit_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Salida" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-3 shrink-0" />
        <span>{formatDate(row.original.exit_date)}</span>
      </div>
    ),
  },
  {
    id: 'controls',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Controles / Tasks" />,
    cell: ({ row }) => {
      const items = row.original.items ?? [];
      const controlCount = items.length;
      const taskCount = items.reduce((sum, item) => sum + (item.tasks?.length ?? 0), 0);

      if (controlCount === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
              <Settings2 className="size-2.5" />
              {controlCount} control{controlCount !== 1 ? 'es' : ''}
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
              <Layers className="size-2.5" />
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          {items.slice(0, 2).map((item) => (
            <p key={item.id} className="max-w-[220px] truncate text-[11px] text-muted-foreground">
              {item.maintenance_control?.title ?? `Control #${item.maintenance_control_id}`}
            </p>
          ))}
          {items.length > 2 && (
            <p className="text-[11px] text-muted-foreground/60">+{items.length - 2} más</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'remarks',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Observaciones" />,
    cell: ({ row }) => (
      <p className="max-w-[200px] truncate text-sm text-muted-foreground">
        {row.original.remarks || '—'}
      </p>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const wo = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/estelar/planificacion/ordenes_trabajo/${wo.order_number}`}>
                Ver detalle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(wo.order_number)}
            >
              Copiar Nro. Orden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
