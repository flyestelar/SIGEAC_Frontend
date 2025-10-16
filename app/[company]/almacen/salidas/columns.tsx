'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, SquarePen, Trash2 } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import DispatchArticlesDialog, {
  DispatchArticle,
} from '@/components/dialogs/mantenimiento/almacen/DispatchArticlesDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MaintenanceAircraft, WorkOrder, Workshop } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IDispatch {
  id: number;
  requested_by: string;
  created_by: string;
  justification: string;
  destination_place: string;
  submission_date: string;
  work_order?: WorkOrder;
  aircraft?: MaintenanceAircraft;
  workshop?: Workshop;
  status: 'PROCESO' | 'APROBADO' | 'RECHAZADO';
  articles: DispatchArticle[];
}

export const columns: ColumnDef<IDispatch>[] = [
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
    accessorKey: 'aircraft',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aeronave / Taller" />,
    cell: ({ row }) => (
      <p className="flex justify-center font-bold">
        {row.original.aircraft
          ? row.original.aircraft.acronym
          : row.original.workshop
            ? row.original.workshop.name
            : 'N/A'}
      </p>
    ),
  },
  {
    accessorKey: 'requested_by',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recibido Por" />,
    cell: ({ row }) => {
      return <p className="font-medium text-center">{row.original.requested_by}</p>;
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <p className="flex justify-center text-muted-foreground italic">
        {format(row.original.submission_date, 'PPP', {
          locale: es,
        })}
      </p>
    ),
  },
  {
    accessorKey: 'articles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Articulos" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DispatchArticlesDialog articles={row.original.articles} />
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="flex gap-2 justify-center">
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Tooltip>
                  <TooltipTrigger>
                    <Trash2 className="size-5 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar</p>
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Tooltip>
                  <TooltipTrigger>
                    <SquarePen className="size-5" />
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      );
    },
  },
];
