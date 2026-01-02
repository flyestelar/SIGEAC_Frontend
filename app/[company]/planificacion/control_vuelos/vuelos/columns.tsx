'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, SquarePen, Trash2, Plane, Route, Clock, Users } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { FlightControl } from '@/types';

// Helpers
type PersonLike =
  | {
      first_name?: string;
      last_name?: string;
      firstName?: string;
      lastName?: string;
    }
  | null
  | undefined;

function fullName(p: PersonLike) {
  if (!p) return '—';
  const first = (p.first_name ?? '').trim();
  const last = (p.last_name ?? '').trim();
  const name = `${first} ${last}`.trim();
  return name.length ? name : '—';
}

function fmtAirport(s?: string) {
  const v = (s ?? '').trim().toUpperCase();
  return v.length ? v : '—';
}

function fmtHours(v?: number | string) {
  const n = typeof v === 'string' ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return '—';
  const out = Number.isInteger(n) ? `${n}` : n.toFixed(2);
  return `${out} h`;
}

export const columns: ColumnDef<FlightControl>[] = [
  {
    accessorKey: 'aircraft.acronym',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Aeronave" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Plane className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="font-semibold tracking-wide">
          {row.original.aircraft?.acronym ?? '—'}
        </Badge>
      </div>
    ),
  },

  {
    accessorKey: 'flight_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Vuelo" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Link
          href={`/estelar/planificacion/control_vuelos/vuelos/${row.original.flight_number}`}
          className="font-semibold hover:underline underline-offset-4"
        >
          {row.original.flight_number}
        </Link>
      </div>
    ),
  },

  // Ruta (origin/destination)
  {
    id: 'route',
    accessorFn: (row) => `${row.origin ?? ''} ${row.destination ?? ''}`,
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Ruta" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Route className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {fmtAirport(row.original.origin)} <span className="mx-1">→</span> {fmtAirport(row.original.destination)}
        </span>
      </div>
    ),
  },

  {
    accessorKey: 'flight_hours',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Horas" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant="outline" className="font-semibold">
          {fmtHours(row.original.flight_hours)}
        </Badge>
      </div>
    ),
  },

  {
    accessorKey: 'flight_cycles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ciclos" />,
    cell: ({ row }) => <p className="text-center font-medium">{Number(row.original.flight_cycles) ?? '—'}</p>,
  },

  // Tripulación (pilot / co_pilot)
  {
    id: 'crew',
    accessorFn: (row) => `${fullName((row as any).pilot)} ${fullName((row as any).co_pilot)}`,
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Tripulación" />,
    cell: ({ row }) => {
      const pilot = fullName((row.original as any).pilot);
      const coPilot = fullName((row.original as any).co_pilot);

      return (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col items-center leading-tight">
            <span className="text-sm font-medium text-foreground">{pilot}</span>
            <span className="text-xs text-muted-foreground">{coPilot}</span>
          </div>
        </div>
      );
    },
  },

  {
    id: 'actions',
    enableHiding: false,
    cell: () => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem className="gap-2">
              <SquarePen className="h-4 w-4" />
              Editar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
