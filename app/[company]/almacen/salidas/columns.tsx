'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';

import DispatchArticlesDialog, {
  DispatchArticle,
} from '@/components/dialogs/mantenimiento/almacen/DispatchArticlesDialog';
import DispatchRequestDropdownActions from '@/components/dropdowns/mantenimiento/almacen/DispatchRequestDropdownActions';
import { MaintenanceAircraft, WorkOrder, Workshop } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IDispatch {
  id: number;
  request_number: string;
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
    accessorKey: 'request_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="N° Solicitud" />,
    cell: ({ row }) => {
      return <p className="font-medium text-center">{row.original.request_number}</p>;
    },
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
    accessorKey: 'created_by',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creado Por" />,
    cell: ({ row }) => {
      return <p className="font-medium text-center">{row.original.created_by}</p>;
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
      const id = row.original.id;
      return <DispatchRequestDropdownActions id={id} />;
    },
  },
];
