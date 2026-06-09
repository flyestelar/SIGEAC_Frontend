'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';

import RequisitionsDropdownActions from '@/components/dropdowns/mantenimiento/compras/RequisitionDropdownActions';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Requisition } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const RequisitionOrderNumberCell = ({ orderNumber }: { orderNumber: string }) => {
  const { selectedCompany } = useCompanyStore();
  return (
    <div className="flex justify-center">
      <Link
        href={`/${selectedCompany?.slug}/compras/solicitudes_material_faltante/${orderNumber}`}
        className="text-center font-bold"
      >
        {orderNumber}
      </Link>
    </div>
  );
};

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
interface BatchesWithCountProp extends Batch {
  article_count: number;
}

export const columns: ColumnDef<Requisition>[] = [
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
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nro. Req." />,
    meta: { title: 'Nro. Req.' }, // 👈 Agrega el título aquí
    cell: ({ row }) => <RequisitionOrderNumberCell orderNumber={row.original.order_number} />,
  },
  {
    accessorKey: 'justification',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Justificación" />,
    meta: { title: 'Justificación' },
    cell: ({ row }) => (
      <p className="text-center flex justify-center text-muted-foreground italic">
        {row.original.justification ?? '-'}
      </p>
    ),
  },
  {
    accessorKey: 'requested_by',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitado por" />,
    meta: { title: 'Solicitado por' },
    cell: ({ row }) => <p className="flex justify-center font-bold">{row.original.requested_by}</p>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => {
      const s = row.original.status?.toUpperCase().trim();
      const colorClass =
        s === 'APROBADO'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : s === 'RECHAZADO'
            ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'; // PROCESO, COTIZADO
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={cn('px-2.5 py-0.5 text-xs font-semibold', colorClass)}>
            {row.original.status?.toUpperCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'submission_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha de Creación" />,
    meta: { title: 'Fecha de c.' },
    cell: ({ row }) => <p className="text-center">{format(row.original.submission_date, 'PPP', { locale: es })}</p>,
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    meta: { title: 'Acciones' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <RequisitionsDropdownActions req={row.original} />
      </div>
    ),
  },
];
