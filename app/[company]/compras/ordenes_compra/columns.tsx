'use client';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import PurchaseOrderDropdownActions from '@/components/dropdowns/mantenimiento/compras/PurchaseOrderDropdownActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PurchaseOrder } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function OrderNumberCell({ row }: { row: { original: PurchaseOrder } }) {
  const { company } = useParams<{ company: string }>();
  return (
    <div className="flex justify-center">
      <Link
        href={`/${company}/compras/ordenes_compra/${row.original.order_number}`}
        className="font-mono font-bold hover:underline"
      >
        {row.original.order_number}
      </Link>
    </div>
  );
}

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => row.toggleExpanded()}
        aria-label={row.getIsExpanded() ? 'Contraer' : 'Expandir'}
      >
        <ChevronRight
          className={cn('h-4 w-4 text-muted-foreground transition-transform duration-150', row.getIsExpanded() && 'rotate-90')}
        />
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'order_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nro. de Orden" />,
    cell: ({ row }) => <OrderNumberCell row={row} />,
  },
  {
    accessorKey: 'quote_order.quote_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nro. Cotización" />,
    cell: ({ row }) => (
      <p className="text-center font-mono text-sm">{row.original.quote_order?.quote_number ?? '—'}</p>
    ),
  },
  {
    accessorKey: 'purchase_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <p className="text-center text-sm text-muted-foreground">
        {format(row.original.purchase_date, 'PPP', { locale: es })}
      </p>
    ),
  },
  {
    accessorKey: 'vendor.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
    cell: ({ row }) => (
      <p className="text-center text-sm font-medium">{row.original.vendor.name}</p>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const s = row.original.status?.toUpperCase().trim();
      return (
        <Badge
          className={cn(
            'flex justify-center',
            s === 'PAGADO' ? 'bg-green-500' : 'bg-yellow-500',
          )}
        >
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'article_purchase_order',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Artículos" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.article_purchase_order.length} art.
        </Badge>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <PurchaseOrderDropdownActions po={row.original} />,
  },
];
