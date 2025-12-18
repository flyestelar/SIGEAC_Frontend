import { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DispatchArticlesDialog from '@/components/dialogs/mantenimiento/almacen/DispatchArticlesDialog';
import type { DispatchGroupRow } from './types'; // donde lo pongas

export const columns: ColumnDef<DispatchGroupRow>[] = [
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => row.toggleExpanded()}>
        {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'request_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="N° solicitud" />,
    cell: ({ row }) => <p className="text-center font-semibold">{row.original.request_number}</p>,
  },
  {
    accessorKey: 'aircraftOrWorkshop',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aeronave / Taller" />,
    cell: ({ row }) => <p className="text-center font-medium">{row.original.aircraftOrWorkshop}</p>,
  },
  {
    accessorKey: 'submission_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <p className="text-center text-muted-foreground">
        {format(new Date(row.original.submission_date), 'PPP', { locale: es })}
      </p>
    ),
  },
  {
    id: 'items',
    header: () => <p className="text-center">Ítems</p>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Package className="h-4 w-4" />
        <span className="font-medium text-foreground">{row.original.articles.length}</span>
      </div>
    ),
  },
  {
    id: 'people',
    header: () => <p className="text-center">Detalles</p>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DispatchArticlesDialog requested_by={row.original.requested_by} created_by={row.original.created_by} />
      </div>
    ),
  },
];
