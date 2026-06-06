'use client';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { FlightControl } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FlightControlRowActions } from './_components/FlightControlRowActions';

function formatDate(value?: string | Date | null) {
  if (!value) return 'N/D';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/D';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const getColumns = (companySlug: string): ColumnDef<FlightControl>[] => [
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
    size: 32,
  },
  {
    accessorKey: 'flight_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Vuelo" />,
    cell: ({ row }) => {
      const id = row.original.id;
      const label = row.original.flight_number || `#${id}`;
      const href = `/${companySlug}/planificacion/control_vuelos/vuelos/${encodeURIComponent(String(id))}`;
      return (
        <Link
          href={href}
          className="font-mono text-sm font-medium text-foreground tracking-wider hover:text-sky-700 dark:hover:text-sky-300"
        >
          {label}
        </Link>
      );
    },
  },
  {
    id: 'route',
    accessorFn: (row) => `${row.origin ?? ''} ${row.destination ?? ''}`,
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Ruta" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-mono text-sm tracking-wider">
        <span>{row.original.origin || '—'}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
        <span>{row.original.destination || '—'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'flight_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">{formatDate(row.original.flight_date)}</span>
    ),
  },
  {
    id: 'flight_hours',
    accessorFn: (row) => Number(row.flight_hours ?? 0),
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} title="Horas" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        <span className="text-sm font-medium">{Number(row.original.flight_hours ?? 0).toFixed(1)}</span>
        <span className="ml-1 text-[11px] text-muted-foreground">h</span>
      </div>
    ),
  },
  {
    id: 'flight_cycles',
    accessorFn: (row) => Number(row.flight_cycles ?? 0),
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} title="Ciclos" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm font-medium tabular-nums">
        {Number(row.original.flight_cycles ?? 0)}
      </div>
    ),
  },
  {
    accessorKey: 'aircraft_operator',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Operador" />,
    cell: ({ row }) => {
      const v = row.original.aircraft_operator;
      if (!v) return <span className="text-sm text-muted-foreground">—</span>;
      return <span className="text-sm">{v}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <FlightControlRowActions flightControl={row.original} />
      </div>
    ),
    size: 56,
  },
];
