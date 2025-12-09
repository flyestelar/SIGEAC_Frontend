import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DispatchArticleRow {
  dispatchId: number;
  request_number: string;
  aircraftOrWorkshop: string;
  submission_date: string;

  part_number: string;
  description: string;
  quantity: number;
  serial?: string | null;
}

export const columns: ColumnDef<DispatchArticleRow>[] = [
  {
    accessorKey: 'request_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="N° solicitud" />,
    cell: ({ row }) => <p className="text-center font-medium">{row.original.request_number}</p>,
  },
  {
    accessorKey: 'aircraftOrWorkshop',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aeronave / Taller" />,
    cell: ({ row }) => <p className="text-center font-bold">{row.original.aircraftOrWorkshop}</p>,
  },
  {
    accessorKey: 'part_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Part Number" />,
    cell: ({ row }) => <p className="text-center">{row.original.part_number}</p>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => <p className="truncate">{row.original.description}</p>,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cant/Serial" />,
    cell: ({ row }) => (
      <p className="text-center">
        {row.original.quantity}
        {row.original.serial ? ` / ${row.original.serial}` : ''}
      </p>
    ),
  },
  {
    accessorKey: 'submission_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <p className="text-center italic text-muted-foreground">
        {format(row.original.submission_date, 'PPP', { locale: es })}
      </p>
    ),
  },
];
